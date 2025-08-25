// const vision = require('@google-cloud/vision');
// // Google Vision API configuration

// const client = new vision.ImageAnnotatorClient({
//     keyFilename: process.env.GOOGLE_VISION_KEYFILE || 'p-project-457518-4a56e63357e5.json',
// });

// const FriendlyLabels = 
//         ['toy','cartoon','fun','colorful','cute','playful','action figure','figurine','stuffed toy', 'plush', 'mascot', 
//         'fictional character','baby toys','plastic','robot','animation','animated cartoon','collectable','doll'];        

// async function detectLabels(imagePath) {
//     try {
//         const [labelResult] = await client.labelDetection(imagePath);
//         const labels = labelResult.labelAnnotations.map(label => label.description.toLocaleLowerCase());

//         const [propertiesResult] = await client.imageProperties(imagePath);
//         const dominantColors = propertiesResult.imagePropertiesAnnotation.dominantColors.colors;
//         const hasFriendlyLabel = labels.some(label => FriendlyLabels.includes(label));
//         //const isColorful = dominantColors.some(color => {color.score > 0.3 && color.pixelFraction > 0.1 && color.color});
//         const isColorful = dominantColors.some(c =>
//             (c.score > 0.3) && (c.pixelFraction > 0.1) && !!c.color
//             );

//         console.log(`Detected labels of imagePath :`, labels);
//         console.log(`Has friendly label of imagePath $:`, hasFriendlyLabel);
//         console.log(`Is colorful of imagePath :`, isColorful);

//         if (hasFriendlyLabel || isColorful) {
//             console.log('Image is friendly or colorful');
//             return true;
//         } else {
//             console.log('Image is not friendly or colorful');
//             return false;
//         }
//     } catch (error) {
//         console.error('Error detecting labels:', error);
//         throw new Error('Failed to detect labels');
//     }
// }

// (async ()=>{
//     try {
//         const testImagePath = 'https://res.cloudinary.com/dmzmufy56/image/upload/v1749483741/arttoy/product/srdusvht7v3chs7nyyap.jpg'; 
//         const isFriendly = await detectLabels(testImagePath);
//         console.log(`Is the image friendly? ${isFriendly}`);
//     } catch (error) {
//         console.error('Error in label detection:', error);
//     }
// })();

// module.exports = { client, detectLabels };
/**
 * Google Vision integration (bugfixed + production-ready)
 * - ยืดหยุ่นเรื่อง credential: รองรับ GCV_JSON_BASE64, GCV_SERVICE_ACCOUNT_JSON,
 *   GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_VISION_KEYFILE, และ ADC
 * - ใช้ annotateImage() ครั้งเดียว/รูป (หลาย feature) หรือ batchAnnotateImages() สำหรับหลายรูป
 * - รวมสัญญาณหลายตัว: SafeSearch, Labels(+score), ImageProperties (สี), OCR (คำต้องห้าม), Logo, Object
 * - ตัดสินใจ verdict: approved | pending | rejected พร้อมเหตุผล
 * - ไม่ทำให้ระบบล่มถ้า Vision พัง (ค่าเริ่มต้น: คืน pending + reasons=['vision_error'])
 */

const vision = require('@google-cloud/vision');

// ---------- Credential Builder ----------
function buildVisionClient() {
  // A) base64 ของ service account JSON
  if (process.env.GCV_JSON_BASE64) {
    const json = JSON.parse(
      Buffer.from(process.env.GCV_JSON_BASE64, 'base64').toString('utf8')
    );
    return new vision.ImageAnnotatorClient({
      credentials: {
        client_email: json.client_email,
        private_key: json.private_key,
      },
      projectId: json.project_id,
    });
  }

  // B) JSON string ตรง ๆ ใน ENV
  if (process.env.GCV_SERVICE_ACCOUNT_JSON) {
    const json = JSON.parse(process.env.GCV_SERVICE_ACCOUNT_JSON);
    return new vision.ImageAnnotatorClient({
      credentials: {
        client_email: json.client_email,
        private_key: json.private_key,
      },
      projectId: json.project_id,
    });
  }

  // C) ใช้ path ไฟล์คีย์ (หรือ ADC ถ้าตั้ง GOOGLE_APPLICATION_CREDENTIALS)
  const keyFile =
    process.env.GOOGLE_VISION_KEYFILE || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    return new vision.ImageAnnotatorClient({ keyFilename: keyFile });
  }

  // D) สุดท้ายลอง Default Credentials (เช่นรันบน GCP ที่ bind SA ไว้แล้ว)
  return new vision.ImageAnnotatorClient();
}

const client = buildVisionClient();

// ---------- Config / Rules ----------
const RANK = { UNKNOWN:0, VERY_UNLIKELY:1, UNLIKELY:2, POSSIBLE:3, LIKELY:4, VERY_LIKELY:5 };

const DEFAULTS = {
  thresholds: {
    labelScore: 0.70,              // label ที่น่าเชื่อถือ
    safeBlockRank: RANK.LIKELY,    // adult/violence/racy ระดับ LIKELY ขึ้นไป = block
    colorful: { score: 0.30, pixelFraction: 0.08 }, // สีโดดเด่นพอ
  },
  bannedText: [
    // TH / EN ตัวอย่าง (ปรับตามนโยบายของโปรเจ็กต์)
    'ไอดีไลน์','line id','แอดไลน์','qr','โอนเงิน','พร้อมเพย์','พนัน','หวย',
    'sex', '18+', 'xxx', 'porn', 'nsfw', 'scam', 'bitcoin investment'
  ],
  friendlyKeywords: [
    'toy','toys','cartoon','fun','colorful','cute','playful',
    'action figure','figurine','figure','stuffed toy','plush','mascot',
    'fictional character','baby toys','plastic','robot','animation',
    'animated cartoon','collectable','collectible','doll','model','miniature'
  ],
  friendlyObjects: [
    'toy','doll','action figure','figurine','robot','plush','stuffed toy','mascot'
  ],
  failBehavior: 'pending', // 'pending' | 'throw' เมื่อ Vision error
  maxLabelResults: 25,
  maxOcrChars: 5000,
};

// ---------- Helpers ----------
function normalize(str = '') { return String(str || '').toLowerCase(); }

function hasFriendlyLabel(labels, { friendlyKeywords, thresholds }) {
  return (labels || []).some(l => {
    const d = normalize(l.description);
    const scoreOK = Number(l.score || 0) >= thresholds.labelScore;
    if (!scoreOK || !d) return false;
    return friendlyKeywords.some(k => d.includes(k));
  });
}

function isColorfulEnough(colors = [], { thresholds }) {
  // bugfix: ต้อง return ใน some() เสมอ
  return colors.some(c => (c.score > thresholds.colorful.score) &&
                          (c.pixelFraction > thresholds.colorful.pixelFraction));
}

function containsBannedText(text = '', { bannedText }) {
  const t = normalize(text);
  return bannedText.some(b => t.includes(normalize(b)));
}

function objectFriendly(objects = [], { friendlyObjects }) {
  const names = (objects || []).map(o => normalize(o.name));
  return names.some(n => friendlyObjects.some(k => n.includes(k)));
}

function buildFeatureSet(maxResults) {
  return [
    { type: 'SAFE_SEARCH_DETECTION' },
    { type: 'LABEL_DETECTION',       maxResults },
    { type: 'IMAGE_PROPERTIES' },
    { type: 'TEXT_DETECTION' },
    { type: 'LOGO_DETECTION',        maxResults: 10 },
    { type: 'OBJECT_LOCALIZATION',   maxResults: 10 },
  ];
}

// ใช้ตัดสินจาก response ของ Vision (single image)
function evaluateVisionResponse(imageUri, res, cfg = DEFAULTS) {
  const safe  = res.safeSearchAnnotation || {};
  const labels = res.labelAnnotations || [];
  const colors = res.imagePropertiesAnnotation?.dominantColors?.colors || [];
  const ocrText = res.fullTextAnnotation?.text || '';
  const logos = res.logoAnnotations || [];
  const objects = res.localizedObjectAnnotations || [];

  // Rule A: block content
  const unsafe =
    (RANK[safe.adult]    >= cfg.thresholds.safeBlockRank) ||
    (RANK[safe.violence] >= cfg.thresholds.safeBlockRank) ||
    (RANK[safe.racy]     >= cfg.thresholds.safeBlockRank);

  // Rule B: friendly
  const friendly =
    hasFriendlyLabel(labels, cfg) ||
    objectFriendly(objects, cfg) ||
    isColorfulEnough(colors, cfg);

  // Rule C: text banned
  const banned = containsBannedText(ocrText.slice(0, cfg.maxOcrChars), cfg);

  let verdict = 'pending';
  const reasons = [];

  if (unsafe) { verdict = 'rejected'; reasons.push('unsafe_content'); }
  if (banned) { verdict = 'rejected'; reasons.push('banned_text'); }

  if (verdict !== 'rejected') {
    verdict = friendly ? 'approved' : 'pending';
    if (!friendly) reasons.push('low_confidence');
  }

  if (logos?.length > 0 && verdict === 'approved') {
    // ไม่ block แต่ติดธงไว้เพื่อให้แอดมินทบทวนเรื่องลิขสิทธิ์
    reasons.push('logo_detected_review');
  }

  // สรุปสั้น ๆ สำหรับเก็บแนบใน product.moderation (ถ้าต้องการ)
  const labelBrief = labels.slice(0, 10).map(({ description, score }) => ({ description, score }));
  const objectBrief = (objects || []).slice(0, 10).map(o => o.name);

  return {
    imageUri,
    verdict,
    reasons,
    safeSearch: safe,
    labels: labelBrief,
    objects: objectBrief,
    ocrSample: ocrText.slice(0, 1000),
    colors: colors.slice(0, 5),
  };
}

// ---------- Public APIs ----------
/**
 * ตรวจรูปเดี่ยว
 * @param {string} imageUri - URL (เช่น Cloudinary) หรือ gs://
 * @param {object} options  - override DEFAULTS
 * @returns {Promise<{verdict:'approved'|'pending'|'rejected', reasons:string[], ...}>}
 */
async function moderateImage(imageUri, options = {}) {
  const cfg = { ...DEFAULTS, ...options, thresholds: { ...DEFAULTS.thresholds, ...(options.thresholds || {}) } };
  try {
    const [res] = await client.annotateImage({
      image: { source: { imageUri } },
      features: buildFeatureSet(cfg.maxLabelResults),
    });
    return evaluateVisionResponse(imageUri, res, cfg);
  } catch (err) {
    console.error('[Vision] moderateImage error:', err?.message || err);
    if (cfg.failBehavior === 'throw') throw err;
    return {
      imageUri,
      verdict: 'pending',
      reasons: ['vision_error'],
      error: String(err?.message || err),
    };
  }
}

/**
 * ตรวจหลายรูปในโพสต์เดียว (batch)
 * กติกา: ถ้ามีรูปไหนโดน "rejected" ทั้งโพสต์ rejected, มิฉะนั้นถ้ามีรูป "approved" อย่างน้อย 1 → approved, ไม่งั้น pending
 * @param {string[]} imageUris
 * @param {object} options
 * @returns {Promise<{final:string, results:Array}>}
 */
async function moderatePost(imageUris = [], options = {}) {
  const cfg = { ...DEFAULTS, ...options, thresholds: { ...DEFAULTS.thresholds, ...(options.thresholds || {}) } };

  // ว่างเปล่า → pending
  if (!Array.isArray(imageUris) || imageUris.length === 0) {
    return { final: 'pending', results: [] };
  }

  try {
    // ทำ batch ในคำขอเดียวเพื่อลด latency/cost
    const requests = imageUris.map(uri => ({
      image: { source: { imageUri: uri } },
      features: buildFeatureSet(cfg.maxLabelResults),
    }));

    const [batch] = await client.batchAnnotateImages({ requests });

    const results = (batch?.responses || []).map((res, idx) =>
      evaluateVisionResponse(imageUris[idx], res, cfg)
    );

    const anyRejected = results.some(r => r.verdict === 'rejected');
    const anyApproved = results.some(r => r.verdict === 'approved');

    let final = 'pending';
    if (anyRejected) final = 'rejected';
    else if (anyApproved) final = 'approved';
    console.log("📦 moderatePost result:", { final, results });
    return { final, results };
  } catch (err) {
    console.error('[Vision] moderatePost error:', err?.message || err);
    if (cfg.failBehavior === 'throw') throw err;
    // fail-safe: ทั้งโพสต์ pending
    return {
      final: 'pending',
      results: imageUris.map(uri => ({
        imageUri: uri,
        verdict: 'pending',
        reasons: ['vision_error'],
        error: String(err?.message || err),
      })),
    };
  }
}

/**
 * ดีบัก project id (ใช้ชั่วคราวยืนยัน credential)
 */
async function getVisionProjectId() {
  try {
    const id = await client.getProjectId();
    return id;
  } catch (e) {
    return null;
  }
}




module.exports = {
  client,
  buildVisionClient,
  moderateImage,
  moderatePost,
  getVisionProjectId,
  // เผื่ออยากใช้กติกานี้ที่อื่น
  evaluateVisionResponse,
  DEFAULTS,
};

// (async () => {
//   try {
//     // // ✅ เทสทีละรูป
//     // const testImage = "https://res.cloudinary.com/dmzmufy56/image/upload/v1749483741/arttoy/product/srdusvht7v3chs7nyyap.jpg";
//     // const oneResult = await moderateImage(testImage);
//     // console.log("🔍 moderateImage result:", oneResult);

//     // ✅ เทสหลายรูป (โพสต์เต็ม ๆ)
    // const testImages = [
    //   "https://res.cloudinary.com/dmzmufy56/image/upload/v1749483741/arttoy/product/srdusvht7v3chs7nyyap.jpg",
    //   "https://res.cloudinary.com/dmzmufy56/image/upload/v1756100465/arttoy/product/k31zf0kmu7mqhkiecf42.jpg"
    // ];
    
//     const postResult = await moderatePost(testImages);
//     console.log("📦 moderatePost result:", JSON.stringify(postResult, null, 2));

//     // postResult = { final: 'approved' | 'pending' | 'rejected', results: [ ...แต่ละรูป... ] }

//   } catch (err) {
//     console.error("❌ Error testing Vision moderation:", err);
//   }
// })();
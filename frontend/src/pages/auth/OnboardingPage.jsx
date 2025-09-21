// // src/pages/OnboardingPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useAuth  } from "../../context/AuthContext";

function SelectCard({ selected, onClick, title, image }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition",
        selected ? "ring-2 ring-yellow-500 border-yellow-400" : "hover:shadow-md"
      ].join(" ")}
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="h-36 w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3 text-left">
        <div className="line-clamp-1 font-medium text-gray-800">{title}</div>
      </div>
    </button>
  );
}
  
export default function Onboarding() {
  // ตัวอย่าง array รูปภาพสำหรับแบรนด์ (แก้ไข url ตามต้องการ)
  const brandImages = [
    "https://lh7-us.googleusercontent.com/YWo3GLJ8AN8r-4ywZx8VBKvu0t2XMob3L76ktAFhnodCZbioYVuNdmBdMAa4oj30Pgcvyvicr22FCGgiZi_GtEKfXP_pVkdW2UE7OD8yUkZDmYXywAU1m4AxijNJjI-ihXS7WnPnCkDVH1QiIOrQo58",
    "https://urbanattitude.com.au/cdn/shop/products/bearbrick-100-blind-box-series-45-cute-rilakkuma-light-urban-attitude_1080x.jpg?v=1677290170",
    "https://urbaneez.s3.eu-central-1.amazonaws.com/artwork/jo-di-bona-bearbrick-1000/jo-di-bona-bearbrick-1000-0.jpeg",
    "https://obs-ect.line-scdn.net/r/ect/ect/cj0tN2ViMHJvMHRsNmx0OCZzPWpwNiZ0PW0mdT0xZjE4YWc5ZzQzajAwJmk9MA",
    "https://d2cva83hdk3bwc.cloudfront.net/be-rbrick-bape-camo-200--set-of-2-pcs--1.jpg",
    "https://www.dollynoire.com/cdn/shop/files/BEARBRICK400_EVANGELIONEVA-13NEWPAINT2-PACK.jpg?v=1689598174",
    "https://cdn.ennxo.com/uploads/products/640/ef7f544ba903458891611862e64608bb.jpg",
    "https://cdn1.sgliteasset.com/SheldonetToyStore/images/collection/collection-21435/fSLd5Yo766b5e02dcd482_1723195437.png",
    "https://scontent.fbkk5-4.fna.fbcdn.net/v/t39.30808-6/465419397_8822157274470899_8087166043417375841_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=cf85f3&_nc_ohc=4FSHiNME6LsQ7kNvwEZYE_v&_nc_oc=AdnZbttBJngS0piHlHL9R6b6LdvGVFI-5iKCqQQGLLTwCZOQSwvjk-b0jSi4LcecGlmTiIbwQHfX6-SuwqWTrrWU&_nc_zt=23&_nc_ht=scontent.fbkk5-4.fna&_nc_gid=QYYcNWQMOHYYa0Wd_uqiVg&oh=00_AfYe0Y0kw0yQ9lVejgNEY0_K6qUFvspN9Zx5z591XF8eDQ&oe=68CFF2B0",
    "https://www.krungsri.com/getmedia/754c301b-c308-46ae-b178-93c70f1feacf/know-arttoy-invest-future-image01.webp.aspx",
    "https://www.shutterstock.com/image-photo/bangkok-thailand-july-2-2022-600nw-2185762991.jpg",
    "https://p.lnwfile.com/woh8xk.jpg",
    "https://pbs.twimg.com/media/GJ0Egp_akAA0tj2.jpg",
    "https://my-live-01.slatic.net/p/dcd818b7eeefbac31d2b1f48547ce664.jpg",
    "https://img.lazcdn.com/g/ff/kf/S4db55394bf18453f9373275a2a7e008ff.jpg_960x960q80.jpg_.webp",
    "https://m.media-amazon.com/images/I/61d-AkRD84L._UF894,1000_QL80_.jpg",
    "https://pbs.twimg.com/media/GV6NgSFbwAAaBrC.jpg:large",
    "https://img.4gamers.com.tw/news-image/ca33cef4-3a7c-4598-bb03-55f64b629ae3.jpg",
    "https://s.isanook.com/tr/0/ui/288/1442355/pop-mart-3.jpg",
    "https://cq.lnwfile.com/_webp_max_images/1024/1024/8n/z5/lj.webp",
    "https://p.lnwfile.com/_webp_resize_images/300/300/ch/wd/ie.webp",
    "https://www.hobbyfanclub.com/web/board/2020/kk2u3l4sqmjakttv5ylq21122020214425792.jpg",
    "https://down-th.img.susercontent.com/file/sg-11134201-7rdwr-lzyvdkl04ab0f0",
  ];
  // ตัวอย่าง array รูปภาพสำหรับแท็ก (แก้ไข url ตามต้องการ)
  const tagImages = [
    "https://emsphere.co.th/wp-content/uploads/2024/06/52toys-pic.jpg",
    "https://media.nationthailand.com/uploads/images/contents/w1024/2024/08/MnMK476DMR9WLejQEr51.webp?x-image-process=style/lg-webp",
    "https://images.squarespace-cdn.com/content/v1/624c7514b33b0168ade16519/b9dc244e-59b9-4d35-ae69-9ed8d6ca24bc/bearbricks-for-sale-dope-gallery-min.jpg",
    "https://www.krungsri.com/getmedia/cc512780-4adf-4bf6-bcda-9a4233f5eab4/know-arttoy-invest-future-image06.webp.aspx",
    "https://thaipublica.org/wp-content/uploads/2023/11/13-ArtToyThree-2.jpg",
    "https://hommesthailand.com/wp-content/uploads/2024/06/8_8NKCOiDyBU_1200x1200_0.jpg",
    // เพิ่มตามจำนวนแท็ก
  ];
  const { user, setUser , refreshUser} = useAuth();
  const navigate = useNavigate();

  // ---------- Step state ----------
  const [step, setStep] = useState(0); // 0=category, 1=brand, 2=tag
  const [submitting, setSubmitting] = useState(false);

  // ---------- Master options ----------
  const categories = useMemo(
    () => [
      { value: "Figure",         label: "Figure",        img: "https://image.makewebcdn.com/makeweb/m_1920x0/yWSGoz9KF/04_POPMART/20240807_141258_889661____5_____1200x1200.jpg" },
      { value: "Action Figure",  label: "Action Figure", img: "https://cdn11.bigcommerce.com/s-csqcv5l47s/images/stencil/804x804/products/2407/5540/CAP_AMERICA_SELECT_1__31656.1744998926.jpg?c=1" },
      { value: "Blind Box",      label: "Blind Box",     img: "https://laz-img-sg.alicdn.com/p/e6c256acd0cc63f85698550c609ff414.jpg" },
      { value: "Plush Toys",     label: "Plush Toys",    img: "https://m.media-amazon.com/images/I/81ECQgWabfL.jpg" },
      { value: "Art Work",       label: "Art Work",      img: "https://media.timeout.com/images/106006274/image.jpg" },
    ],
    []
  );
  const [brands, setBrands] = useState([]);
  const [tags, setTags] = useState([]);

  // ---------- Selected ----------
  const [selCats, setSelCats] = useState([]);
  const [selBrandIds, setSelBrandIds] = useState([]);
  const [selTagIds, setSelTagIds] = useState([]);

  // Load brands & tags once
  useEffect(() => {
    (async () => {
      try {
        const [b, t] = await Promise.all([
          api.get("/api/brand"),
          api.get("/api/tags"),
        ]);
        setBrands(b.data || []);
        setTags(t.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const toggle = (arr, v) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  const canNext =
    (step === 0 && selCats.length > 0) ||
    (step === 1 && selBrandIds.length > 0) ||
    (step === 2 /* tags optional: อนุญาตข้ามหรือบังคับก็ได้ */);

  const goNext = () => setStep(s => Math.min(2, s + 1));
  const goBack = () => setStep(s => Math.max(0, s - 1));

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.put("/api/pref/preferences", {
        categories: selCats,      // string[]
        brands: selBrandIds,      // ObjectId[]
        tags: selTagIds,          // ObjectId[]
        // weights ไม่ต้องส่งก็ได้ (ใช้ default ใน model)
      });
      setUser(prev => ({ ...prev, ...data.user }));
      await refreshUser();
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      alert("บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1 text-xs font-medium text-yellow-800">
            ตั้งค่าความสนใจเพื่อการแนะนำที่ดีกว่า
          </div>
          <h1 className="text-2xl md:text-4xl text-black font-extrabold tracking-tight">
            {step === 0 && "เลือกหมวดหมู่ที่คุณสนใจ"}
            {step === 1 && "เลือกแบรนด์ / คอลเลกชันที่คุณสนใจ"}
            {step === 2 && "เลือกแท็กที่คุณสนใจ (ถ้ามี)"}
          </h1>
        </div>

        {/* Step indicator */}
        <div className="mx-auto mb-8 flex max-w-2xl items-center justify-center gap-2">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={[
                "h-2 w-16 rounded-full",
                i <= step ? "bg-yellow-400" : "bg-gray-200"
              ].join(" ")}
            />
          ))}
        </div>

        {/* Canvas */}
        <div className="rounded-3xl bg-yellow-50 p-4 md:p-6">
          {/* Step 0: Categories */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {categories.map(c => (
                <SelectCard
                  key={c.value}
                  selected={selCats.includes(c.value)}
                  onClick={() => setSelCats(prev => toggle(prev, c.value))}
                  title={c.label}
                  image={c.img}
                />
              ))}
            </div>
          )}

          {/* Step 1: Brands */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {brands.map(b => (
                <SelectCard
                  key={b._id}
                  selected={selBrandIds.includes(b._id)}
                  onClick={() => setSelBrandIds(prev => toggle(prev, b._id))}
                  title={b.name}
                  image={b.cover ? b.cover : brandImages[brands.indexOf(b) % brandImages.length]}
                />
              ))}
            </div>
          )}

          {/* Step 2: Tags (optional) */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {tags.map((t, idx) => (
              <SelectCard
                key={t._id}
                selected={selTagIds.includes(t._id)}
                onClick={() => setSelTagIds(prev => toggle(prev, t._id))}
                title={t.name}
                image={tagImages[idx % tagImages.length]} // <-- ใส่รูปแต่ละแท็กตรงนี้
              />
             ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className={[
              "rounded-xl px-5 py-2 text-sm font-medium transition",
              step === 0 ? "cursor-not-allowed bg-gray-100 text-gray-400" :
              "bg-gray-800 text-white hover:bg-gray-700"
            ].join(" ")}
          >
            ย้อนกลับ
          </button>

          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canNext}
              className={[
                "rounded-2xl px-6 py-3 text-base font-semibold transition",
                canNext ? "bg-yellow-400 text-black hover:bg-yellow-500" :
                          "bg-gray-200 text-gray-400 cursor-not-allowed"
              ].join(" ")}
            >
              ต่อไป
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-2xl bg-yellow-500 px-6 py-3 text-base font-semibold text-black hover:bg-yellow-600 disabled:opacity-60"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึกและเริ่มใช้งาน"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
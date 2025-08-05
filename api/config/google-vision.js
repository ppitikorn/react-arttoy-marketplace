const vision = require('@google-cloud/vision');
// Google Vision API configuration

const client = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_VISION_KEYFILE || 'p-project-457518-4a56e63357e5.json',
});

async function detectLabels(imagePath) {
    try {
        const [labelResult] = await client.labelDetection(imagePath);
        const labels = labelResult.labelAnnotations.map(label => label.description.toLocaleLowerCase());

        const [propertiesResult] = await client.imageProperties(imagePath);
        const dominantColors = propertiesResult.imagePropertiesAnnotation.dominantColors.colors;
        const FriendlyLabels = 
        ['toy','cartoon','fun','colorful','cute','playful','action figure','figurine','stuffed toy', 'plush', 'mascot', 
        'fictional character','baby toys','plastic','robot','animation','animated cartoon','collectable','doll'];
        const hasFriendlyLabel = labels.some(label => FriendlyLabels.includes(label));
        const isColorful = dominantColors.some(color => {color.score > 0.3 && color.pixelFraction > 0.1 && color.color});
        console.log(`Detected labels of imagePath ${imagePath}:`, labels);
        // console.log(`Has friendly label of imagePath ${imagePath}:`, hasFriendlyLabel);
        // console.log(`Is colorful of imagePath ${imagePath}:`, isColorful);

        if (hasFriendlyLabel || isColorful) {
            console.log('Image is friendly and colorful');
            return true;
        } else {
            console.log('Image is not friendly or colorful');
            return false;
        }
    } catch (error) {
        console.error('Error detecting labels:', error);
        throw new Error('Failed to detect labels');
    }
}

// (async ()=>{
//     try {
//         const testImagePath = 'https://res.cloudinary.com/dmzmufy56/image/upload/v1749483741/arttoy/product/srdusvht7v3chs7nyyap.jpg'; 
//         const isFriendly = await detectLabels(testImagePath);
//         console.log(`Is the image friendly? ${isFriendly}`);
//     } catch (error) {
//         console.error('Error in label detection:', error);
//     }
// })();

module.exports = { client, detectLabels };

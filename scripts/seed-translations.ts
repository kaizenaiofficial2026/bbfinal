import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Shared inclusions (identical across packages).
const inc = {
  ar: ["نقل من المطار", "إفطار يومي", "مساعد Beyond Borders مخصّص"],
  hi: ["हवाई अड्डा स्थानांतरण", "दैनिक नाश्ता", "समर्पित Beyond Borders सहायक"],
  kn: ["ವಿಮಾನ ನಿಲ್ದಾಣ ವರ್ಗಾವಣೆ", "ದೈನಂದಿನ ಉಪಾಹಾರ", "ಮೀಸಲಾದ Beyond Borders ಸಹಾಯಕ"],
  te: ["విమానాశ్రయ బదిలీ", "ప్రతిరోజు అల్పాహారం", "అంకిత Beyond Borders సహాయకుడు"],
  ur: ["ایئرپورٹ ٹرانسفر", "روزانہ ناشتہ", "مخصوص Beyond Borders معاون"],
  zh: ["机场接送", "每日早餐", "专属 Beyond Borders 助理"],
};

const d4n3 = { ar: "4 أيام / 3 ليالٍ", hi: "4 दिन / 3 रातें", kn: "4 ದಿನ / 3 ರಾತ್ರಿ", te: "4 రోజులు / 3 రాత్రులు", ur: "4 دن / 3 راتیں", zh: "4 天 / 3 晚" };

const packageTranslations: Record<string, Record<string, Record<string, unknown>>> = {
  "sunbath-on-sands-standard": {
    ar: { title: "حمام الشمس على الرمال", tier: "شاطئ / استجمام", hotels: "ست نجوم", duration: d4n3.ar, summary: "رحلة هادئة من كولومبو إلى بنتوتا مع أوقات على المحيط ومناظر نهرية واستجمام خمس نجوم بجانب البحر.", inclusions: inc.ar },
    hi: { title: "रेत पर धूप-स्नान", tier: "समुद्रतट / आराम", hotels: "6 सितारा", duration: d4n3.hi, summary: "कोलंबो से बेंतोता तक एक आरामदेह सफर, समुद्र के पल, नदी के दृश्य और समुद्र किनारे फाइव-स्टार आराम के साथ।", inclusions: inc.hi },
    kn: { title: "ಮರಳಿನ ಮೇಲೆ ಸೂರ್ಯಸ್ನಾನ", tier: "ಕಡಲತೀರ / ವಿರಾಮ", hotels: "6-ಸ್ಟಾರ್", duration: d4n3.kn, summary: "ಕೊಲಂಬೊದಿಂದ ಬೆಂತೋಟಕ್ಕೆ ಶಾಂತ ಪ್ರಯಾಣ, ಸಾಗರ ಸಮಯ, ನದಿ ದೃಶ್ಯ ಮತ್ತು ಸಮುದ್ರ ತೀರದ ಐದು-ಸ್ಟಾರ್ ವಿರಾಮದೊಂದಿಗೆ.", inclusions: inc.kn },
    te: { title: "ఇసుకపై సూర్యస్నానం", tier: "బీచ్ / విశ్రాంతి", hotels: "6-స్టార్", duration: d4n3.te, summary: "కొలంబో నుండి బెంతోటకు ప్రశాంత ప్రయాణం, సముద్ర సమయం, నది దృశ్యాలు మరియు సముద్ర తీరాన ఫైవ్-స్టార్ విశ్రాంతితో.", inclusions: inc.te },
    ur: { title: "ریت پر دھوپ اشنان", tier: "ساحل / فرصت", hotels: "چھ ستارہ", duration: d4n3.ur, summary: "کولمبو سے بینتوٹا تک ایک پُرسکون سفر، سمندری لمحات، دریائی مناظر اور ساحل کنارے فائیو اسٹار فرصت کے ساتھ۔", inclusions: inc.ur },
    zh: { title: "金沙日光浴", tier: "海滩 / 休闲", hotels: "六星", duration: d4n3.zh, summary: "从科伦坡到本托塔的悠闲之旅，享受海上时光、河岸风光与海边五星休闲。", inclusions: inc.zh },
  },
  "glamour-of-sri-lanka": {
    ar: { title: "سحر سريلانكا", tier: "فاخر", hotels: "خمس نجوم", duration: d4n3.ar, summary: "كولومبو في أبهى صورها، مع إقامة خمس نجوم وتجارب طعام منتقاة وإيقاع أنيق لمدينة العاصمة.", inclusions: inc.ar },
    hi: { title: "श्रीलंका का आकर्षण", tier: "लक्ज़री", hotels: "5 सितारा", duration: d4n3.hi, summary: "कोलंबो अपने सबसे परिष्कृत रूप में, फाइव-स्टार जीवन, चुनिंदा भोजन और राजधानी शहर की सुरुचिपूर्ण लय के साथ।", inclusions: inc.hi },
    kn: { title: "ಶ್ರೀಲಂಕಾದ ವೈಭವ", tier: "ಐಷಾರಾಮಿ", hotels: "5-ಸ್ಟಾರ್", duration: d4n3.kn, summary: "ಕೊಲಂಬೊ ತನ್ನ ಅತ್ಯಂತ ಪರಿಷ್ಕೃತ ರೂಪದಲ್ಲಿ, ಐದು-ಸ್ಟಾರ್ ಜೀವನ, ಆಯ್ದ ಭೋಜನ ಮತ್ತು ರಾಜಧಾನಿ ನಗರದ ಸೊಗಸಾದ ಲಯದೊಂದಿಗೆ.", inclusions: inc.kn },
    te: { title: "శ్రీలంక వైభవం", tier: "లగ్జరీ", hotels: "5-స్టార్", duration: d4n3.te, summary: "కొలంబో అత్యంత మెరుగైన రూపంలో, ఫైవ్-స్టార్ జీవనం, ఎంపిక చేసిన భోజనం మరియు రాజధాని నగర సొగసైన లయతో.", inclusions: inc.te },
    ur: { title: "سری لنکا کی شان", tier: "پُرتعیش", hotels: "پانچ ستارہ", duration: d4n3.ur, summary: "کولمبو اپنی بہترین شکل میں، فائیو اسٹار رہائش، منتخب کھانوں اور دارالحکومت کی شائستہ تال کے ساتھ۔", inclusions: inc.ur },
    zh: { title: "斯里兰卡的魅力", tier: "豪华", hotels: "五星", duration: d4n3.zh, summary: "科伦坡最精致的一面，五星居停、精选餐饮与优雅的首都节奏。", inclusions: inc.zh },
  },
  "a-classic-of-the-city": {
    ar: { title: "كلاسيكية المدينة", tier: "كلاسيكي", hotels: "فنادق راقية", duration: d4n3.ar, summary: "إقامة كولومبو الأساسية، توازن بين الأحياء الكولونيالية والمعابد والأسواق وأوقات راحة مريحة في المدينة.", inclusions: inc.ar },
    hi: { title: "शहर का एक क्लासिक", tier: "क्लासिक", hotels: "गुणवत्तापूर्ण होटल", duration: d4n3.hi, summary: "कोलंबो का अनिवार्य प्रवास, औपनिवेशिक इलाकों, मंदिरों, बाज़ारों और शहर के आरामदायक अवकाश का संतुलन।", inclusions: inc.hi },
    kn: { title: "ನಗರದ ಒಂದು ಕ್ಲಾಸಿಕ್", tier: "ಕ್ಲಾಸಿಕ್", hotels: "ಗುಣಮಟ್ಟದ ಹೋಟೆಲ್‌ಗಳು", duration: d4n3.kn, summary: "ಕೊಲಂಬೊದ ಅಗತ್ಯ ವಾಸ್ತವ್ಯ, ವಸಾಹತುಶಾಹಿ ಪ್ರದೇಶಗಳು, ದೇವಾಲಯಗಳು, ಬಜಾರ್‌ಗಳು ಮತ್ತು ಆರಾಮದಾಯಕ ನಗರ ವಿರಾಮದ ಸಮತೋಲನ.", inclusions: inc.kn },
    te: { title: "నగరం యొక్క క్లాసిక్", tier: "క్లాసిక్", hotels: "నాణ్యమైన హోటళ్లు", duration: d4n3.te, summary: "కొలంబో అత్యవసర బస, వలసవాద ప్రాంతాలు, దేవాలయాలు, బజార్లు మరియు సౌకర్యవంతమైన నగర విశ్రాంతి సమతుల్యత.", inclusions: inc.te },
    ur: { title: "شہر کا ایک کلاسک", tier: "کلاسک", hotels: "معیاری ہوٹل", duration: d4n3.ur, summary: "کولمبو کا لازمی قیام، نوآبادیاتی محلوں، مندروں، بازاروں اور شہر کے آرام دہ وقفے کا توازن۔", inclusions: inc.ur },
    zh: { title: "都市经典", tier: "经典", hotels: "优质酒店", duration: d4n3.zh, summary: "科伦坡的经典之选，在殖民街区、寺庙、集市与舒适的城市闲暇之间取得平衡。", inclusions: inc.zh },
  },
  "the-heart-of-city": {
    ar: { title: "قلب المدينة", tier: "قياسي", hotels: "ثلاث نجوم", duration: "3 أيام / ليلتان", summary: "استراحة كولومبو مدمجة تغطي أساسيات المدينة مع التنقّلات والإفطار وراحة بسيطة مُدبَّرة.", inclusions: inc.ar },
    hi: { title: "शहर का दिल", tier: "स्टैंडर्ड", hotels: "3 सितारा", duration: "3 दिन / 2 रातें", summary: "एक संक्षिप्त कोलंबो ब्रेक जो ट्रांसफर, नाश्ते और सरल सुविधा के साथ शहर की मूलभूत बातें संभालता है।", inclusions: inc.hi },
    kn: { title: "ನಗರದ ಹೃದಯ", tier: "ಸ್ಟ್ಯಾಂಡರ್ಡ್", hotels: "3-ಸ್ಟಾರ್", duration: "3 ದಿನ / 2 ರಾತ್ರಿ", summary: "ವರ್ಗಾವಣೆ, ಉಪಾಹಾರ ಮತ್ತು ಸರಳ ಸೌಕರ್ಯದೊಂದಿಗೆ ನಗರದ ಅಗತ್ಯಗಳನ್ನು ಒಳಗೊಂಡ ಸಂಕ್ಷಿಪ್ತ ಕೊಲಂಬೊ ವಿರಾಮ.", inclusions: inc.kn },
    te: { title: "నగరం హృదయం", tier: "స్టాండర్డ్", hotels: "3-స్టార్", duration: "3 రోజులు / 2 రాత్రులు", summary: "బదిలీలు, అల్పాహారం మరియు సాధారణ సౌకర్యంతో నగర అవసరాలను కవర్ చేసే సంక్షిప్త కొలంబో విరామం.", inclusions: inc.te },
    ur: { title: "شہر کا دل", tier: "اسٹینڈرڈ", hotels: "تین ستارہ", duration: "3 دن / 2 راتیں", summary: "ایک مختصر کولمبو وقفہ جو ٹرانسفرز، ناشتے اور سادہ سہولت کے ساتھ شہر کی بنیادی باتیں سنبھالتا ہے۔", inclusions: inc.ur },
    zh: { title: "城市之心", tier: "标准", hotels: "三星", duration: "3 天 / 2 晚", summary: "紧凑的科伦坡短途，含接送、早餐与简单舒适，覆盖城市精华。", inclusions: inc.zh },
  },
};

async function run() {
  for (const [slug, translations] of Object.entries(packageTranslations)) {
    const { error } = await supabase
      .from("tour_packages")
      .update({ translations })
      .eq("slug", slug);
    if (error) throw new Error(`${slug}: ${error.message}`);
    console.log(`✓ ${slug}`);
  }
  console.log("Package translations seeded.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

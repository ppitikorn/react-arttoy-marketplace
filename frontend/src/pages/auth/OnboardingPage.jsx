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
  const {  setUser , refreshUser} = useAuth();
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
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            {step === 0 && "สำรวจตามหมวดหมู่"}
            {step === 1 && "เลือกแบรนด์ที่คุณชอบ"}
            {step === 2 && "เลือกแท็กที่สนใจ (ถ้ามี)"}
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
                  image={b.cover || "/img/brand-placeholder.jpg"}
                />
              ))}
            </div>
          )}

          {/* Step 2: Tags (optional) */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {tags.map(t => (
                <SelectCard
                  key={t._id}
                  selected={selTagIds.includes(t._id)}
                  onClick={() => setSelTagIds(prev => toggle(prev, t._id))}
                  title={t.name}
                  image={"/img/tag-placeholder.jpg"}
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

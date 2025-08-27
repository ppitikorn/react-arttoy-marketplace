// src/utils/onboarding.js
export function onboardingRequired(user) {
  if (!user) return false;

  // เคยทำแล้วก็ไม่บังคับอีก
  if (user.hasOnboarded) return false;

  const p = user.preferences || {};
  const hasCats   = Array.isArray(p.categories) && p.categories.length > 0;
  const hasBrands = Array.isArray(p.brands)     && p.brands.length > 0;
  const hasTags   = Array.isArray(p.tags)       && p.tags.length > 0;

  // ถ้ายังไม่มีอะไรเลย = ต้องทำ
  return !(hasCats || hasBrands || hasTags);
}

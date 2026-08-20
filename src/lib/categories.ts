export const CATEGORIES = [
  {
    slug: 'basic-pension',
    name: '기초연금',
    description: '기초연금 수급자격, 지급액, 신청방법',
  },
  {
    slug: 'long-term-care',
    name: '노인장기요양보험',
    description: '등급판정 신청, 재가·시설급여, 본인부담금',
  },
  {
    slug: 'senior-jobs',
    name: '노인일자리·사회활동',
    description: '노인일자리 종류, 신청방법, 활동비',
  },
  {
    slug: 'national-pension',
    name: '국민연금 수령',
    description: '국민연금 수령나이, 조기·연기수령, 유족연금',
  },
  {
    slug: 'elder-life-support',
    name: '노후생활지원',
    description: '경로우대 교통, 의료비 지원 등 노후 생활 지원 제도',
  },
] as const;

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

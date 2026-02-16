import {
  Users,
  Heart,
  Building2,
  Database,
} from 'lucide-react'

export const TrustBar = () => {
  return (
    <section aria-label="서비스 통계" className="border-y border-border/60 bg-muted/30 py-5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-2 font-medium text-foreground">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          개인 + 사업자 모두 이용 가능
        </span>
        <span className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          복지로 + 보조금24 데이터 연동
        </span>
        <span className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          중소벤처기업부 데이터 연동
        </span>
        <span className="hidden h-4 w-px bg-border/60 sm:block" aria-hidden="true" />
        <span className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          공공데이터 기반
        </span>
      </div>
    </section>
  )
}

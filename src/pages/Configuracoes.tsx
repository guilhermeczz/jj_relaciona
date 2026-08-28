import { Settings, Database, KeyRound, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function Configuracoes() {
  const { profile, user } = useAuth()

  return (
    <div>
      <PageHeader title="Configurações" description="Informações do sistema e do seu acesso." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" /> Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row icon={<Database className="h-4 w-4" />} label="Supabase configurado">
              {isSupabaseConfigured() ? (
                <span className="text-emerald-600">Sim</span>
              ) : (
                <span className="text-amber-600">Não — defina as variáveis de ambiente</span>
              )}
            </Row>
            <Row icon={<ShieldCheck className="h-4 w-4" />} label="Versão">
              MVP 0.1.0
            </Row>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> Meu acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Nome">{profile?.nome}</Row>
            <Row label="E-mail">{user?.email}</Row>
            <Row label="Perfil">{profile?.perfil}</Row>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-brand-gray px-4 py-3">
      <span className="flex items-center gap-2 text-sm font-medium text-brand-black">
        {icon}
        {label}
      </span>
      <span className="text-sm text-muted-foreground">{children}</span>
    </div>
  )
}

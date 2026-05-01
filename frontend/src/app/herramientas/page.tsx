import { redirect } from 'next/navigation';

export default function HerramientasRedirectPage() {
  redirect('/inventario?tab=herramientas');
}

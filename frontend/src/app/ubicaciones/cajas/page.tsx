import { redirect } from 'next/navigation';

export default function CajasRedirectPage() {
  redirect('/ubicaciones?tab=cajas');
}

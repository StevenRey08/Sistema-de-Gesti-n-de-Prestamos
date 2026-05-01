import { redirect } from 'next/navigation';

export default function EstantesRedirectPage() {
  redirect('/ubicaciones?tab=estantes');
}

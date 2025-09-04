import { env } from '@documenso/lib/utils/env';

export async function createProductFactura(body: {
  code: string;
  name: string;
  price: number;
  clavePS: number;
  unity: string;
  claveUnity: string;
}) {
  console.log('Creating product in Factura with body:', body);
  console.log('Using API Key:', env('NEXT_PRIVATE_FACTURA_API_KEY'));
  const response = await fetch('https://sandbox.factura.com/api/v3/products/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'F-PLUGIN': env('NEXT_PRIVATE_FACTURA_PLUGIN') || '',
      'F-Api-Key': env('NEXT_PRIVATE_FACTURA_API_KEY') || '',
      'F-Secret-Key': env('NEXT_PRIVATE_FACTURA_SECRET_KEY') || '',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  return data;
}

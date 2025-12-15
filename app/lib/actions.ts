'use server';

import { z } from 'zod'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id:z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({id:true, date:true})

export async function createInvoices(formdata: FormData) {
    const {customerId, amount, status } = CreateInvoice.parse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status'),
    });
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    await sql`
    INSERT INTO invoices (customer_Id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
//     await sql`
//     INSERT INTO invoices (customer_id, amount, status, date)
//     VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
//   `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices')
}

// use zod to update the expected types
const UpdateInvoice = FormSchema.omit({id:true, date:true});

export async function updateInvoice(id:string, formdata: FormData) {
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formdata.get('customerId'),
        amount: formdata.get('amount'),
        status: formdata.get('status'),
    });

    const amountInCents = amount * 100;

    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}
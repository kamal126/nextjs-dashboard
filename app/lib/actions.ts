"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import postgres from "postgres";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({invalid_type_error: 'Please select a customer.'}),
  amount: z.coerce.number().gt(0, {message:'Please enter an amount grater than $0.'}),
  status: z.enum(["pending", "paid"],{invalid_type_error:'Please select an invoice status.'}),
  date: z.string(),
});

export type State = {
  errors?:{
    customerId?: string[],
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoices(prevState: State, formdata: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formdata.get("customerId"),
    amount: formdata.get("amount"),
    status: formdata.get("status"),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // prepare data to inserting into db
  const {customerId, amount, status} = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  // insert data into db
  try {
    await sql`
        INSERT INTO invoices (customer_Id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
  } catch (error) {
    // We'll also log the error to the console for now
    console.error(error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
    // throw new Error("Database Error: Failed to Create Invoice.")
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// use zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formdata: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formdata.get("customerId"),
    amount: formdata.get("amount"),
    status: formdata.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    console.log(error);
    throw new Error(`Database Error: Failed to Update Invoice.`);

  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to delete invoice.');  // manually create simulate error
  await sql`
    DELETE FROM invoices WHERE id=${id}
    `;

  revalidatePath("/dashboard/invoices");
}

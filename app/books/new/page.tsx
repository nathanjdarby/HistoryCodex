import { redirect } from "next/navigation";

export default function NewBookRedirectPage() {
  redirect("/books/browse");
}

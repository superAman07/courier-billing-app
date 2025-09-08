import CustomerForm from "@/components/CustomerForm";
import { Suspense } from "react";

export default function (){
    return <Suspense fallback={<div className="p-6 text-gray-600">Loading…</div>}>
      <CustomerForm />
    </Suspense>
}
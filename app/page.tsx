'use client'
export default function Home() {
  return (
    <main className="space-x-3">
      <button onClick={()=>{window.location.href='/customer'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Customer Master</button>
      <button onClick={()=>{window.location.href='/all-customers'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">All Customers</button>
      <button onClick={()=>{window.location.href='/rate-master'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Rate Master</button>
      <button onClick={()=>{window.location.href='/copy-rates'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Copy Rate</button>
      <button onClick={()=>{window.location.href='/rate-template'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Customer Rate Template</button>
      <button onClick={()=>{window.location.href='/tax-master'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Tax Master</button>
    </main>
  );
}
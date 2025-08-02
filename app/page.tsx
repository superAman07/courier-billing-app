'use client'
export default function Home() {
  return (
    <main>
      <button onClick={()=>{window.location.href='/customer'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Add Customer</button>
      <button onClick={()=>{window.location.href='/rate-master'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Add Rate</button>
    </main>
  );
}
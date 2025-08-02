'use client'
export default function Home() {
  return (
    <main>
      <button onClick={()=>{window.location.href='/customer'}} className="bg-blue-600 cursor-pointer text-white px-4 py-2 rounded-md">Add Customer</button>
    </main>
  );
}
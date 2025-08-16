'use client'
export default function Home() {
  return (
    <main className="space-x-3">
      <div className="flex h-screen space-y-4">
        <section className="p-6 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center">Masters</h1>
          <div className="flex flex-col space-y-2">
            <button onClick={() => { window.location.href = '/customer' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Customer Master</button>
            <button onClick={() => { window.location.href = '/all-customers' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">All Customers</button>
            <button onClick={() => { window.location.href = '/rate-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Rate Master</button>
            <button onClick={() => { window.location.href = '/copy-rates' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Copy Rate</button>
            <button onClick={() => { window.location.href = '/rate-template' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Customer Rate Template</button>
            <button onClick={() => { window.location.href = '/tax-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Tax Master</button>
            <button onClick={() => { window.location.href = '/country-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Country Master</button>
            <button onClick={() => { window.location.href = '/zone-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Zone Master</button>
            <button onClick={() => { window.location.href = '/state-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">State Master</button>
            <button onClick={() => { window.location.href = '/city-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">City Master</button>
            <button onClick={() => { window.location.href = '/pincode-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Pincode Mapping Master</button>
            <button onClick={() => { window.location.href = '/invoice-settings' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Invoice Configuration</button>
            <button onClick={() => { window.location.href = '/registration-details' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Modify Registration Details</button>
            <button onClick={() => { window.location.href = '/book-rate-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Book Rate Master</button>
            <button onClick={() => { window.location.href = '/employee-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Employee Master</button>
            <button onClick={() => { window.location.href = '/create-user' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Create User</button>
          </div>
        </section>
      </div>
    </main>
  );
}
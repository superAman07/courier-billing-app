'use client'
export default function Home() {
  return (
    <main className="space-x-3">
      <div className="flex h-screen space-y-4">
        <section className="p-6 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-600">Masters</h1>
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
            <button onClick={() => { window.location.href = '/sms-api-settings' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">SMS API Settings</button>
            <button onClick={() => { window.location.href = '/sms-templates' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">SMS Templates</button>
          </div>
        </section>
        <section className="p-6 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-600">Booking</h1>
          <div className="flex flex-col space-y-2">
            <button onClick={() => { window.location.href = '/cash-booking' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Cash Booking (Domestic)</button>
            <button onClick={() => { window.location.href = '/credit-client-booking' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Credit Client Booking (Domestic)</button>
            <button onClick={() => { window.location.href = '/international-cash-booking' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Cash Booking (International)</button>
            <button onClick={() => { window.location.href = '/international-credit-client-booking' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Credit Client Booking (International)</button>
            <button onClick={() => { window.location.href = '/booking-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Booking Master</button>
            <button onClick={() => { window.location.href = '/smart-booking-master' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Smart Booking Master</button>
            <button onClick={() => { window.location.href = '/all-bookings' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">All Bookings / Bulk Booking</button>
            <button onClick={() => { window.location.href = '/update-and-send-delivery-status' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Update Delivery Status / Send Delivery SMS</button>
          </div>
        </section>
        <section className="p-6 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4 text-center text-gray-600">Billings</h1>
          <div className="flex flex-col space-y-2">
            <button onClick={() => { window.location.href = '/generate-cash-invoice' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Generate Invoice (Cash Booking)</button>
            <button onClick={() => { window.location.href = '/modify-delete-cash-invoice' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Modify / Delete Invoice (Cash Booking)</button>
            <button onClick={() => { window.location.href = '/generate-credit-client-invoice' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Generate Invoice (Credit Client Booking)</button>
            <button onClick={() => { window.location.href = '/modify-credit-client-invoice' }} className="bg-blue-600 hover:bg-blue-800 cursor-pointer text-white px-4 py-2 rounded-md">Modify / Delete Invoice (Credit Client Booking)</button>
          </div>
        </section>
      </div>
    </main>
  );
}
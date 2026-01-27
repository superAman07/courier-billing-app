'use client'
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Search, Upload, MessageCircle, Check, RefreshCw, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookingData {
  type: string
  id: string
  consignmentNo: string
  customer: string
  destination: string
  bookingDate: string
  deliveryStatus?: string
  deliveryDate?: string
  smsSent?: boolean
  smsDate?: string 
  mobile?: string
}

const UpdateDeliveryStatusPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingData[]>([])
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE') 
  const [loading, setLoading] = useState(true)
  const [selectAll, setSelectAll] = useState(false)

  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkDate, setBulkDate] = useState('')
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    let filtered = bookings;

    if (statusFilter === 'ACTIVE') {
      const terminalStates = ['DELIVERED', 'RETURNED', 'INVOICED', 'CANCELLED'];
      filtered = filtered.filter(b => !terminalStates.includes(b.deliveryStatus || ''));
    } else if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.deliveryStatus === statusFilter);
    }
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.consignmentNo.toLowerCase().includes(lowerTerm) ||
        booking.customer.toLowerCase().includes(lowerTerm) ||
        booking.destination.toLowerCase().includes(lowerTerm)
      );
    }

    setFilteredBookings(filtered)
    
    setSelectedRows(new Set()); 
    setSelectAll(false);

  }, [bookings, searchTerm, statusFilter])

  const handleRecallToSmartBooking = async () => {
    if (selectedRows.size === 0) {
        toast.error('Select bookings to recall for editing');
        return;
    }
    
    if(!confirm(`Are you sure you want to RECALL ${selectedRows.size} bookings significantly? This will move them back to Smart Booking Master for all users.`)) return;
    setLoading(true);
    try {
        const bookingsToRecall = filteredBookings.filter(b => selectedRows.has(b.id));
        
        // Update status to 'RECALLED' in Database
        await Promise.all(bookingsToRecall.map(b => 
            axios.put(`/api/update-and-send-delivery-status/${b.type}/${b.id}`, {
                status: 'RECALLED',
                statusDate: new Date().toISOString()
            })
        ));
        toast.success(`Moved ${bookingsToRecall.length} bookings to Smart Master!`);
        
        // Redirect to Smart Master (it will checking DB now, no param needed)
        router.push('/smart-booking-master');
        
    } catch (error) {
        console.error(error);
        toast.error("Failed to recall bookings.");
    } finally {
        setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/update-and-send-delivery-status')
      setBookings(response.data)
      setLoading(false)
    } catch (error) {
      toast.error('Failed to fetch bookings')
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set())
    } else {
      const allIds = filteredBookings.map(booking => booking.id)
      setSelectedRows(new Set(allIds))
    }
    setSelectAll(!selectAll)
  }

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
    setSelectAll(newSelected.size === filteredBookings.length)
  }

  const handleStatusUpdate = async (id: string, type: string, status: string) => {
    try {
      await axios.put(`/api/update-and-send-delivery-status/${type}/${id}`, {
        status,
        statusDate: new Date().toISOString()
      })
      setBookings(prev => prev.map(booking =>
        booking.id === id ? { ...booking, deliveryStatus: status, deliveryDate: new Date().toISOString() } : booking
      ))
      toast.success('Delivery status updated successfully')
    } catch (error) {
      toast.error('Failed to update delivery status')
    }
  }

  const handleDateUpdate = async (id: string, type: string, date: string) => {
    try {
      const booking = bookings.find(b => b.id === id)
      await axios.put(`/api/update-and-send-delivery-status/${type}/${id}`, {
        status: booking?.deliveryStatus || '',
        statusDate: date
      })
      setBookings(prev => prev.map(booking =>
        booking.id === id ? { ...booking, deliveryDate: date } : booking
      ))
      toast.success('Delivery date updated successfully')
    } catch (error) {
      toast.error('Failed to update delivery date')
    }
  }

  const handleSendSMS = async (booking: BookingData) => {
    try {
      await axios.post('/api/send-sms', {
        bookingType: booking.type,
        bookingId: booking.id,
        phoneNumber: booking.mobile,
        messageType: 'delivery'
      });
      await axios.put(`/api/update-and-send-delivery-status/${booking.type}/${booking.id}`, {
        smsSent: true,
        smsDate: new Date().toISOString()
      })

      setBookings(prev => prev.map(b =>
        b.id === booking.id ? { ...b, smsSent: true, smsDate: new Date().toISOString() } : b
      ))

      toast.success('SMS sent successfully')
    } catch (error) {
      toast.error('Failed to send SMS')
    }
  }

  const handleBulkSMS = async () => {
    if (selectedRows.size === 0) {
      toast.error('Please select at least one row')
      return
    }

    try {
      const selectedBookings = filteredBookings.filter(booking => selectedRows.has(booking.id))

      for (const booking of selectedBookings) {
        await handleSendSMS(booking)
      }

      toast.success(`SMS sent to ${selectedRows.size} recipients`)
      setSelectedRows(new Set())
      setSelectAll(false)
    } catch (error) {
      toast.error('Failed to send bulk SMS')
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedRows.size === 0) {
      toast.error('Please select at least one row')
      return;
    }
    if (!bulkStatus && !bulkDate) {
      toast.error('Please select a Status or Date to apply');
      return;
    }

    if (!confirm(`Update ${selectedRows.size} bookings with Status: ${bulkStatus || '(No Change)'} and Date: ${bulkDate || '(No Change)'}?`)) return;

    setIsBulkUpdating(true);
    try {
      const targets = filteredBookings.filter(b => selectedRows.has(b.id));
      
      // Process in batches to avoid overwhelming the server
      const BATCH_SIZE = 10;
      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(booking => {
          const payload: any = {};
          if (bulkStatus) payload.status = bulkStatus;
          
          if (bulkDate) {
             // User selected specific date
             payload.statusDate = new Date(bulkDate).toISOString();
          } else if (bulkStatus) {
             // Status changed but no date picked -> Use current time
             payload.statusDate = new Date().toISOString();
          }

          return axios.put(`/api/update-and-send-delivery-status/${booking.type}/${booking.id}`, payload);
        }));
      }

      // Optimistic UI Update
      setBookings(prev => prev.map(b => {
        if (selectedRows.has(b.id)) {
          return {
            ...b,
            deliveryStatus: bulkStatus || b.deliveryStatus,
            deliveryDate: bulkDate ? new Date(bulkDate).toISOString() : (bulkStatus ? new Date().toISOString() : b.deliveryDate)
          };
        }
        return b;
      }));

      toast.success(`Successfully updated ${targets.length} bookings.`);
      setBulkStatus('');
      setBulkDate('');
      setSelectedRows(new Set());
      setSelectAll(false);

    } catch (error) {
      console.error(error);
      toast.error('Bulk update failed. Some rows might not have updated.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getStatusOptions = () => [
    { value: '', label: 'Select Status' },
    { value: 'BOOKED', label: 'Booked' },
    { value: 'PICKED_UP', label: 'Picked Up' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'FAILED_ATTEMPT', label: 'Failed Attempt' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'INVOICED', label: 'Invoiced' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">

        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-t-lg shadow-lg">
          <h1 className="text-xl font-bold text-center">UPDATE DELIVERY STATUS / SEND DELIVERY SMS</h1>
        </div>

        <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-4 flex justify-between items-center">
          <div className="text-white font-medium">
            Select Consign No. Customer Destination
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-700 cursor-pointer"
            >
              <option value="ACTIVE">⚡ Pending Only (Active)</option>
              <option value="ALL">📂 Show All History</option>
              <option disabled>──────────</option>
              <option value="BOOKED">Booked</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="FAILED_ATTEMPT">Failed Attempt</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Returned</option>
              <option value="INVOICED">Invoiced</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by consignment, customer, or destination"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-b-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-3">
            <div className="grid grid-cols-8 gap-4 text-white font-medium text-sm">
              <div>Select</div>
              <div>Consign No</div>
              <div>Customer</div>
              <div>Destination</div>
              <div>Booking Date</div>
              <div>Delivery Status</div>
              <div>Delivery Date</div>
              <div>Send SMS</div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto bg-gray-100">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bookings found
              </div>
            ) : (
              filteredBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`grid grid-cols-8 gap-4 p-3 border-b border-gray-200 items-center text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(booking.id)}
                      onChange={() => handleRowSelect(booking.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  <div className="font-medium text-gray-900">
                    {booking.consignmentNo}
                  </div>

                  <div className="text-gray-700 truncate">
                    {booking.customer}
                  </div>

                  <div className="text-gray-700 truncate">
                    {booking.destination}
                  </div>

                  <div className="text-gray-600">
                    {formatDate(booking.bookingDate)}
                  </div>

                  <div>
                    <select
                      value={booking.deliveryStatus || ''}
                      onChange={(e) => handleStatusUpdate(booking.id, booking.type, e.target.value)}
                      className="w-full p-1 border border-gray-300 text-gray-600 cursor-pointer rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getStatusOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="date"
                      value={booking.deliveryDate ? booking.deliveryDate.split('T')[0] : ''}
                      onChange={(e) => handleDateUpdate(booking.id, booking.type, e.target.value)}
                      className="w-full p-1 text-gray-500 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <button
                      onClick={() => handleSendSMS(booking)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors relative ${booking.smsSent
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'} cursor-pointer`}
                      title={booking.smsSent ? 'SMS already sent (click to resend)' : 'Send SMS'}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {booking.smsSent && (
                        <Check className="w-3 h-3 absolute right-0 bottom-0 bg-white rounded-full border border-green-200" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-3 w-full xl:w-auto">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-white font-medium whitespace-nowrap">Select All ({selectedRows.size} selected)</span>
            </div>

            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 shadow-inner w-full xl:w-auto justify-center">
                 <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="p-1.5 border border-white/50 bg-white/90 text-gray-800 rounded text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  >
                    {getStatusOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  
                  <input 
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="p-1.5 border border-white/50 bg-white/90 text-gray-800 rounded text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
                  />

                  <button
                    onClick={handleBulkStatusUpdate}
                    disabled={isBulkUpdating}
                    className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 cursor-pointer text-blue-900 font-bold rounded shadow-md text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isBulkUpdating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4"/>}
                    Update
                  </button>
              </div>
            )}

            <button
              onClick={handleBulkSMS}
              disabled={selectedRows.size === 0}
              className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${selectedRows.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm'
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send SMS ({selectedRows.size})</span>
            </button>
            <button
              onClick={handleRecallToSmartBooking}
              disabled={selectedRows.size === 0}
              className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${selectedRows.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                }`}
            >
              <Edit className="w-4 h-4" />
              <span>Recall for Edit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UpdateDeliveryStatusPage

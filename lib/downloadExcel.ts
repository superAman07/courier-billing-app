export function handleDownload() {
  window.open("/api/booking-master/export", "_blank");
}

export function handleDownloadForAllBookings(data?: any[]) {
    if (data) {
        const blob = new Blob([JSON.stringify({ bookings: data })], {
            type: 'application/json',
        });
        fetch('/api/booking-master/export', {
            method: 'POST',
            body: blob,
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Filtered_Bookings_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    } else {
        window.open("/api/booking-master/export", "_blank");
    }
}
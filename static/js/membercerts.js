window.addEventListener('load', () => {
    const elements = document.getElementsByClassName('cert-checkbox')
    for (const checkbox of elements) {
        const [email, cert] = checkbox.getAttribute('name').split('::')
        checkbox.addEventListener('change', async () => {
            const response = await fetch(document.location.href, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    cert: cert,
                    value: checkbox['checked']
                })
            })
            if (!response.ok) {
                alert('Failed to update cert status')
            }
        })
    }
})

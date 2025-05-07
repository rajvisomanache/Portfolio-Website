// --- Portfolio Page Script ---
const revealElements = document.querySelectorAll('.content-section > .container > *, .project-card');

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        
        } 
    });
}, {
    root: null, // viewport
    threshold: 0.1, 
    rootMargin: '0px 0px -50px 0px' // Adjust margin to trigger slightly earlier/later
});

revealElements.forEach(el => {

    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    revealObserver.observe(el);
});


console.log("Portfolio script loaded.");

// --- Contact Form Submission ---
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default page reload

        const submitButton = contactForm.querySelector('.submit-button');
        submitButton.disabled = true; // Disable button during submission
        submitButton.textContent = 'Sending...';
        formStatus.textContent = ''; // Clear previous status
        formStatus.className = 'form-status'; // Reset status class

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries()); // Convert FormData to plain object

        try {
            const response = await fetch('http://localhost:8080/api/contact', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json(); 

            if (response.ok) {
                formStatus.textContent = result.message || 'Message sent successfully!';
                formStatus.classList.add('success');
                contactForm.reset(); // Clear the form fields
            } else {
                throw new Error(result.message || 'An error occurred.');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            formStatus.textContent = `Error: ${error.message || 'Could not send message. Please try again.'}`;
            formStatus.classList.add('error');
        } finally {
            submitButton.disabled = false; // Re-enable button
            submitButton.textContent = 'Send Message';
        }
    });
}
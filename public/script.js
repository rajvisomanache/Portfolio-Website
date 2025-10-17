// --- Portfolio Page Script ---
const revealElements = document.querySelectorAll('.content-section > .container > *, .project-card');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, {
    root: null,
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    revealObserver.observe(el);
});

console.log("Portfolio script loaded.");

// --- Contact Form Submission with Email Verification ---
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');
const emailInput = document.getElementById('email');

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = contactForm.querySelector('.submit-button');
        submitButton.disabled = true;
        submitButton.textContent = 'Checking email...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            // Step 1: Verify email via your disposable email detector
            const emailCheck = await fetch('https://disposable-e-mail-address-detector.onrender.com/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email })
            });

            const checkResult = await emailCheck.json();

            if (checkResult.is_disposable) {
                throw new Error('Please use a valid, non-disposable email.');
            }

            // Step 2: Submit form to your portfolio backend
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                formStatus.textContent = result.message || 'Message sent successfully!';
                formStatus.classList.add('success');
                contactForm.reset();
            } else {
                throw new Error(result.message || 'Form submission failed.');
            }

        } catch (error) {
            console.error('Error:', error);
            formStatus.textContent = `Error: ${error.message}`;
            formStatus.classList.add('error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Send Message';
        }
    });
}

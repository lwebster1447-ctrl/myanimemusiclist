// frontend/src/components/Footer.jsx
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="footer-brand">MyAnimeMusicList</span>
        <span className="footer-copyright">© {currentYear}</span>
        <span className="footer-divider">|</span>
        <span className="footer-contact">
          Contact Support: <a href="mailto:lwebster1447@gmail.com" className="footer-link">lwebster1447@gmail.com</a>
        </span>
        <span className="footer-divider">|</span>
        <a 
          href="https://forms.gle/dLNuKp7bd2WgbDyq5" 
          target="_blank" 
          rel="noopener noreferrer"
          className="footer-link"
        >
          Website Improvement Suggestions
        </a>
      </div>
    </footer>
  );
}
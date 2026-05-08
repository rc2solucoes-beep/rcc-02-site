export function GoogleReviews() {
  return (
    <div className="w-full rounded-lg overflow-hidden shadow-sm">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.4419999999998!2d-46.5319294!3d-23.4424534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cef52583ad1a8d%3A0xf9d6abeb964d95b2!2sRC2%20Solu%C3%A7%C3%B5es!5e0!3m2!1spt-BR!2sbr!4v1715158800000"
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="RC2 Soluções no Google Maps"
      />
    </div>
  );
}

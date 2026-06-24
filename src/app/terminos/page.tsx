import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones — Margot",
  description: "Condiciones de uso de la plataforma Margot.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold">Términos y Condiciones</h1>
          <p className="text-gray-400 mt-2 text-sm">Última actualización: junio de 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        <Section title="1. Objeto y aceptación">
          <p>
            Los presentes Términos y Condiciones (en adelante, "los Términos") regulan el acceso y uso de la plataforma
            <strong> Margot</strong> (en adelante, "la Plataforma"), incluyendo la aplicación web accesible en
            <strong> margot.rest</strong> y todas sus sub-rutas.
          </p>
          <p className="mt-2">
            El acceso o uso de la Plataforma implica la aceptación plena y sin reservas de estos Términos. Si no estás
            de acuerdo con alguna de sus disposiciones, debes abstenerte de usar la Plataforma.
          </p>
        </Section>

        <Section title="2. Descripción del servicio">
          <p>Margot es una plataforma de gestión integral para restaurantes que ofrece:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Para clientes:</strong> consulta del menú, realización de pedidos (delivery o local), seguimiento del estado del pedido y publicación de reseñas.</li>
            <li><strong>Para personal interno:</strong> gestión de pedidos, comandas de cocina y barra, control de inventario, registro de caja diaria, control de mesas, gestión de promociones y registro de asistencia.</li>
          </ul>
          <p className="mt-2">
            Margot se reserva el derecho de modificar, suspender o discontinuar cualquier funcionalidad de la Plataforma
            en cualquier momento, con o sin previo aviso.
          </p>
        </Section>

        <Section title="3. Tipos de usuario y acceso">
          <p>Existen dos categorías de usuarios:</p>
          <div className="mt-3 space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">Clientes</h3>
              <p className="text-sm text-blue-800">
                Personas que acceden a la Plataforma para consultar el menú, hacer pedidos o dejar reseñas. El
                registro es voluntario. Al registrarse, el cliente garantiza que los datos proporcionados son
                verídicos y se compromete a no suplantar la identidad de terceros.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-1">Personal interno</h3>
              <p className="text-sm text-amber-800">
                Empleados y colaboradores de Margot (meseros, cocineros, cajeros, barman, repartidores y
                administradores). Sus cuentas son creadas y administradas exclusivamente por el comercio. Cada
                usuario interno debe usar sus credenciales de manera personal e intransferible y notificar
                inmediatamente cualquier uso no autorizado de su cuenta.
              </p>
            </div>
          </div>
        </Section>

        <Section title="4. Obligaciones del usuario">
          <p>Todo usuario de la Plataforma se compromete a:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Proporcionar información veraz, actualizada y completa durante el registro.</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
            <li>No compartir su cuenta con terceros ni ceder el acceso a personas no autorizadas.</li>
            <li>No intentar acceder a secciones o datos para los que no tiene permiso.</li>
            <li>No usar la Plataforma para fines ilegales, fraudulentos o contrarios a estos Términos.</li>
            <li>No realizar ingeniería inversa, descompilar ni intentar vulnerar la seguridad de la Plataforma.</li>
            <li>Publicar reseñas verídicas y respetuosas, sin contenido ofensivo, difamatorio o falso.</li>
          </ul>
        </Section>

        <Section title="5. Pedidos y pagos">
          <ul className="list-disc pl-5 space-y-2">
            <li>Un pedido se considera confirmado una vez que cambia a estado <strong>"Confirmado"</strong> dentro de la Plataforma.</li>
            <li>Los precios mostrados en el menú incluyen impuestos aplicables según la legislación ecuatoriana vigente.</li>
            <li>Margot puede aplicar códigos de descuento emitidos por el comercio; el uso indebido de códigos no autorizados podrá resultar en la cancelación del pedido.</li>
            <li>Los tiempos de entrega mostrados son estimados y pueden variar por condiciones externas (tráfico, alta demanda, etc.).</li>
            <li>Margot no procesa pagos en línea directamente; los pagos se gestionan de acuerdo con las modalidades disponibles en el momento del pedido (efectivo, transferencia u otros medios habilitados por el comercio).</li>
          </ul>
        </Section>

        <Section title="6. Cancelaciones y devoluciones">
          <ul className="list-disc pl-5 space-y-2">
            <li>Un pedido puede ser cancelado mientras se encuentre en estado <strong>"Pendiente"</strong>. Una vez confirmado y en preparación, la cancelación queda sujeta a criterio del comercio.</li>
            <li>Las solicitudes de devolución o compensación por pedidos incorrectos o insatisfactorios deben presentarse directamente en el local o a través de los canales de atención al cliente.</li>
          </ul>
        </Section>

        <Section title="7. Reseñas y contenido generado por el usuario">
          <ul className="list-disc pl-5 space-y-2">
            <li>Al publicar una reseña, el usuario otorga a Margot una licencia no exclusiva, gratuita y transferible para mostrar dicho contenido en la Plataforma y en materiales promocionales.</li>
            <li>Margot se reserva el derecho de eliminar reseñas que contengan lenguaje ofensivo, información falsa, datos personales de terceros o contenido que infrinja derechos de terceros.</li>
          </ul>
        </Section>

        <Section title="8. Suspensión y cancelación de cuentas">
          <p>Margot podrá suspender o cancelar una cuenta, de forma temporal o permanente, en los siguientes supuestos:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Incumplimiento de estos Términos.</li>
            <li>Uso fraudulento de la Plataforma.</li>
            <li>Solicitud expresa del titular de la cuenta.</li>
            <li>Decisión administrativa del comercio respecto al personal interno.</li>
          </ul>
        </Section>

        <Section title="9. Propiedad intelectual">
          <p>
            Todos los elementos de la Plataforma (diseño, código fuente, logotipos, imágenes, textos, menú y
            contenido) son propiedad de Margot o de sus licenciantes y están protegidos por la legislación de
            propiedad intelectual ecuatoriana e internacional.
          </p>
          <p className="mt-2">
            Queda prohibida su reproducción, distribución o uso comercial sin autorización expresa y por escrito de Margot.
          </p>
        </Section>

        <Section title="10. Limitación de responsabilidad">
          <p>En la medida permitida por la ley, Margot no será responsable de:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Interrupciones del servicio por mantenimiento, fallos técnicos o causas de fuerza mayor.</li>
            <li>Daños derivados del uso incorrecto de las credenciales por parte del usuario.</li>
            <li>Inexactitudes en los tiempos de entrega estimados.</li>
            <li>Contenido publicado por usuarios (reseñas, comentarios).</li>
            <li>Daños indirectos, lucro cesante o pérdida de datos derivados del uso de la Plataforma.</li>
          </ul>
        </Section>

        <Section title="11. Modificaciones de los Términos">
          <p>
            Margot se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios serán publicados
            en esta página con la fecha de actualización. Si continúas utilizando la Plataforma después de la publicación
            de los cambios, se entenderá que los aceptas.
          </p>
        </Section>

        <Section title="12. Ley aplicable y jurisdicción">
          <p>
            Estos Términos se rigen por las leyes de la <strong>República del Ecuador</strong>. Para la resolución de
            cualquier controversia derivada de su interpretación o aplicación, las partes se someten a los tribunales
            competentes de la ciudad de <strong>Guayaquil, Ecuador</strong>, renunciando expresamente a cualquier otro
            fuero que pudiera corresponderles.
          </p>
        </Section>

        <Section title="13. Contacto">
          <p>Para cualquier consulta relacionada con estos Términos:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Correo electrónico: <strong>info@margot.rest</strong></li>
            <li>Sitio web: <strong>margot.rest</strong></li>
          </ul>
        </Section>

        <div className="border-t pt-6 text-center text-sm text-gray-400">
          <Link href="/privacidad" className="text-brand-gold hover:underline">Ver Política de Privacidad</Link>
          <span className="mx-3">·</span>
          <Link href="/" className="hover:underline">Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h2>
      <div className="text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

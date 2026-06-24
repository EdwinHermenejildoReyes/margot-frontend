import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — Margot",
  description: "Cómo recopilamos, usamos y protegemos tu información personal.",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a1a2e] text-white">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold">Política de Privacidad</h1>
          <p className="text-gray-400 mt-2 text-sm">Última actualización: junio de 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        <Section title="1. Responsable del tratamiento">
          <p>
            <strong>Margot Restaurante</strong> (en adelante, "Margot", "nosotros" o "la empresa") es el responsable
            del tratamiento de los datos personales recabados a través de esta plataforma, de conformidad con la
            <strong> Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> del Ecuador y su reglamento.
          </p>
          <p className="mt-2">
            Para cualquier consulta relacionada con el tratamiento de tus datos puedes contactarnos a través de los
            canales indicados al final de este documento.
          </p>
        </Section>

        <Section title="2. Datos que recopilamos">
          <SubSection title="2.1 Clientes">
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de identificación: nombre completo y dirección de correo electrónico.</li>
              <li>Datos de contacto: número de teléfono (opcional).</li>
              <li>Datos de uso: historial de pedidos, productos solicitados, métodos de pago utilizados y reseñas publicadas.</li>
              <li>Datos técnicos: tokens de sesión almacenados en cookies seguras (httpOnly) para autenticación.</li>
            </ul>
          </SubSection>
          <SubSection title="2.2 Personal interno (meseros, cocineros, cajeros, repartidores, etc.)">
            <ul className="list-disc pl-5 space-y-1">
              <li>Datos de identificación: nombre completo, correo electrónico y rol dentro del sistema.</li>
              <li>Datos de asistencia: fecha, hora y <strong>geolocalización</strong> en el momento del registro de entrada y salida. La geolocalización se solicita únicamente para verificar la presencia en el lugar de trabajo y no se comparte con terceros.</li>
              <li>Datos operativos: pedidos atendidos, comandas gestionadas, movimientos de inventario y registros de caja relacionados con la actividad laboral.</li>
              <li>Datos técnicos: tokens de sesión almacenados en cookies seguras (httpOnly) para autenticación.</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. Finalidad del tratamiento">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Dato</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-700">Finalidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Nombre y correo", "Crear y gestionar la cuenta de usuario, identificar al titular del pedido."],
                ["Historial de pedidos", "Prestar el servicio, calcular facturación, generar estadísticas internas."],
                ["Reseñas", "Publicar opiniones de manera asociada al perfil del cliente."],
                ["Geolocalización (personal)", "Verificar la asistencia al centro de trabajo."],
                ["Datos de asistencia", "Control laboral, generación de reportes de puntualidad."],
                ["Cookies de sesión (JWT)", "Mantener la sesión activa de forma segura sin requerir contraseña en cada interacción."],
              ].map(([dato, fin]) => (
                <tr key={dato} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{dato}</td>
                  <td className="px-4 py-2 text-gray-600">{fin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="4. Base legal del tratamiento">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Ejecución de un contrato:</strong> los datos necesarios para procesar pedidos y gestionar cuentas se tratan en virtud de la relación contractual entre el usuario y Margot.</li>
            <li><strong>Consentimiento:</strong> para el tratamiento de datos opcionales (p. ej. reseñas, datos de contacto adicionales). El consentimiento puede retirarse en cualquier momento.</li>
            <li><strong>Interés legítimo:</strong> para la geolocalización del personal de acuerdo con las políticas laborales de la empresa, garantizando siempre la proporcionalidad de la medida.</li>
            <li><strong>Obligación legal:</strong> cuando el tratamiento sea necesario para cumplir disposiciones legales ecuatorianas.</li>
          </ul>
        </Section>

        <Section title="5. Cookies y tecnologías similares">
          <p>Margot utiliza las siguientes cookies:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>access_token</strong> (httpOnly, segura): token de acceso JWT. No accesible desde JavaScript. Se elimina al cerrar sesión.</li>
            <li><strong>refresh_token</strong> (httpOnly, segura, path restringido): permite renovar la sesión sin introducir contraseña. Se invalida y elimina al cerrar sesión.</li>
            <li><strong>csrftoken</strong> (lectura JS): protección contra ataques CSRF. No contiene datos personales.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            No utilizamos cookies de publicidad ni de seguimiento de terceros.
          </p>
        </Section>

        <Section title="6. Conservación de los datos">
          <ul className="list-disc pl-5 space-y-1">
            <li>Los datos de cuenta se conservan mientras la cuenta esté activa.</li>
            <li>El historial de pedidos y movimientos de caja se conserva por el período exigido por la normativa fiscal ecuatoriana (mínimo 7 años).</li>
            <li>Los registros de asistencia se conservan durante la vigencia de la relación laboral y hasta 3 años después de su terminación.</li>
            <li>Las cookies de sesión expiran automáticamente: el token de acceso a los 30 minutos y el token de actualización a las 24 horas.</li>
          </ul>
        </Section>

        <Section title="7. Compartición de datos con terceros">
          <p>
            Margot <strong>no vende ni cede</strong> tus datos personales a terceros con fines comerciales. Los datos
            únicamente podrán ser comunicados a:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Autoridades competentes cuando exista una obligación legal.</li>
            <li>Proveedores de infraestructura tecnológica (servidores) bajo acuerdos de confidencialidad y con acceso mínimo necesario.</li>
          </ul>
        </Section>

        <Section title="8. Seguridad">
          <p>
            Aplicamos medidas técnicas y organizativas para proteger tus datos:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Comunicaciones cifradas mediante HTTPS/TLS.</li>
            <li>Tokens de autenticación almacenados en cookies httpOnly inaccesibles desde JavaScript.</li>
            <li>Base de datos PostgreSQL con acceso restringido por red.</li>
            <li>Control de acceso basado en roles (RBAC): cada usuario solo accede a la información que su función requiere.</li>
            <li>Registro de auditoría: cada modificación de datos queda registrada con el usuario que la realizó.</li>
          </ul>
        </Section>

        <Section title="9. Tus derechos (LOPDP Ecuador)">
          <p>De acuerdo con la Ley Orgánica de Protección de Datos Personales tienes derecho a:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Acceso:</strong> conocer qué datos tuyos tratamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento basado en interés legítimo.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado y legible por máquina.</li>
            <li><strong>Limitación:</strong> restringir el tratamiento en los casos previstos por la ley.</li>
          </ul>
          <p className="mt-3">
            Para ejercer cualquiera de estos derechos escríbenos al correo indicado en la sección de contacto. Responderemos en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
        </Section>

        <Section title="10. Menores de edad">
          <p>
            Margot no recopila intencionalmente datos de personas menores de 15 años. Si eres padre/madre o tutor y crees que tu hijo ha proporcionado datos personales, contáctanos para proceder a su eliminación.
          </p>
        </Section>

        <Section title="11. Modificaciones">
          <p>
            Nos reservamos el derecho de actualizar esta política para reflejar cambios en nuestras prácticas o en la normativa aplicable. Te notificaremos de cambios relevantes a través de la plataforma. La versión vigente siempre estará disponible en esta página.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>Para ejercer tus derechos o resolver cualquier duda sobre privacidad:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Correo electrónico: <strong>info@margot.rest</strong></li>
            <li>Sitio web: <strong>margot.rest</strong></li>
          </ul>
        </Section>

        <div className="border-t pt-6 text-center text-sm text-gray-400">
          <Link href="/terminos" className="text-brand-gold hover:underline">Ver Términos y Condiciones</Link>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      {children}
    </div>
  );
}

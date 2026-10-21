import { APP_NAME, CONTACT_EMAIL, CONTROLLER_NAME } from '@/config'

const LAST_UPDATED = '21 de octubre de 2026'

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold leading-tight">
        {title}
      </h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-neutral-700">
        {children}
      </div>
    </section>
  )
}

export default function Privacy() {
  const contact = (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium underline underline-offset-2"
    >
      {CONTACT_EMAIL}
    </a>
  )

  return (
    <article className="mx-auto max-w-md px-4 pb-16 pt-8 sm:max-w-2xl">
      <h1 className="font-display text-2xl font-semibold leading-tight">
        Política de privacidad
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Última actualización: {LAST_UPDATED}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-neutral-700">
        {APP_NAME} es una aplicación para crear listas de regalos y compartirlas
        con amigos y familia. Recogemos lo mínimo necesario para que funcione:
        no hay publicidad, no hay analítica y no vendemos ni cedemos tus datos.
      </p>

      <Section title="Quién es el responsable">
        <p>
          El responsable del tratamiento es {CONTROLLER_NAME}, que gestiona{' '}
          {APP_NAME} como proyecto personal sin ánimo de lucro. Para cualquier
          consulta sobre tus datos, escribe a {contact}.
        </p>
      </Section>

      <Section title="Qué datos tratamos">
        <p>
          <strong>Si creas listas</strong> (inicias sesión con Google): tu
          nombre, tu correo electrónico, tu foto de perfil y el identificador de
          tu cuenta de Google, que Google nos facilita al iniciar sesión.
          También guardamos las listas y los regalos que añades (títulos,
          precios, secciones y enlaces).
        </p>
        <p>
          <strong>Si reservas un regalo</strong> desde un enlace compartido: el
          nombre que escribes al reservar y un identificador anónimo de sesión
          que se crea al hacer tu primera reserva, para que solo tú puedas
          deshacerla. No necesitas cuenta ni te pedimos correo.
        </p>
        <p>
          <strong>Datos técnicos</strong>: como en cualquier web, nuestros
          proveedores de alojamiento y base de datos registran tu dirección IP y
          datos básicos del navegador para servir la página y protegerla contra
          abusos.
        </p>
        <p>
          No te pedimos datos sensibles ni tomamos decisiones automatizadas
          sobre ti. Las listas no son privadas: cualquier persona con el enlace
          puede ver su contenido, así que no incluyas información que no quieras
          compartir.
        </p>
      </Section>

      <Section title="Para qué los usamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identificarte como dueño de tus listas y dejarte editarlas.</li>
          <li>
            Mostrar a quien tenga el enlace qué regalos están reservados y por
            quién, para que nadie repita.
          </li>
          <li>Mantener el servicio seguro y evitar abusos.</li>
        </ul>
        <p>
          El dueño de una lista <strong>no ve</strong> qué regalos están
          reservados ni quién los ha reservado. Los nombres de las reservas solo
          los ven quienes abren la lista con el enlace compartido.
        </p>
        <p>
          Las bases legales son la ejecución del servicio que nos pides (crear y
          compartir listas, reservar regalos; art. 6.1.b RGPD) y nuestro interés
          legítimo en mantenerlo seguro (art. 6.1.f RGPD). No usamos tus datos
          para otros fines ni los cedemos a terceros, salvo obligación legal.
        </p>
      </Section>

      <Section title="Quién más interviene">
        <p>
          Usamos los siguientes proveedores para prestar el servicio. Supabase y
          Vercel tratan datos por cuenta nuestra, con contrato de encargado del
          tratamiento; Google y Microlink actúan con su propia política de
          privacidad:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Supabase</strong>: base de datos e inicio de sesión.
          </li>
          <li>
            <strong>Vercel</strong>: alojamiento de la web.
          </li>
          <li>
            <strong>Google</strong>: inicio de sesión con tu cuenta de Google y
            tipografías de la web (Google Fonts).
          </li>
          <li>
            <strong>Microlink</strong>: cuando un regalo no tiene imagen, tu
            navegador le envía el enlace de compra para obtener una portada.
          </li>
        </ul>
        <p>
          Las imágenes de los regalos se cargan directamente desde las tiendas
          enlazadas, que pueden ver tu dirección IP al mostrarlas. Algunos
          proveedores tratan datos fuera del Espacio Económico Europeo (por
          ejemplo, en Estados Unidos); lo hacen con las garantías que exige el
          RGPD, como las cláusulas contractuales tipo o el Marco de Privacidad
          de Datos UE-EE. UU.
        </p>
      </Section>

      <Section title="Cookies y almacenamiento local">
        <p>
          No usamos cookies de publicidad ni de seguimiento. Guardamos en tu
          navegador (almacenamiento local) solo lo imprescindible: tu sesión, y
          el nombre que usaste al reservar para no tener que escribirlo otra
          vez. Puedes borrarlo en cualquier momento desde los ajustes de tu
          navegador.
        </p>
      </Section>

      <Section title="Cuánto tiempo los guardamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Tu cuenta, tus listas y tus regalos, mientras no los borres o nos
            pidas eliminar tu cuenta.
          </li>
          <li>
            Una reserva, hasta que quien la hizo la deshace o el dueño borra el
            regalo o la lista.
          </li>
          <li>
            Las sesiones anónimas de quienes reservan se eliminan
            periódicamente. Las reservas que hicieron se mantienen, pero ya no
            se pueden deshacer.
          </li>
        </ul>
      </Section>

      <Section title="Tus derechos">
        <p>
          Puedes pedirnos acceder a tus datos, corregirlos, borrarlos,
          llevártelos a otro servicio, limitar su uso u oponerte a él,
          escribiendo a {contact}. Responderemos en un plazo máximo de un mes.
          Al eliminar tu cuenta se borran también tus listas y sus regalos, con
          las reservas que contengan. Si te basas en tu consentimiento, puedes
          retirarlo en cualquier momento.
        </p>
        <p>
          Si crees que no hemos atendido bien tu solicitud, puedes reclamar ante
          la autoridad de protección de datos de tu país (en España, la Agencia
          Española de Protección de Datos, aepd.es).
        </p>
      </Section>

      <Section title="Menores">
        <p>
          {APP_NAME} no está dirigida a menores de 14 años. Si eres menor de esa
          edad, no crees una cuenta.
        </p>
      </Section>

      <Section title="Cambios">
        <p>
          Si cambiamos esta política, actualizaremos la fecha de arriba. Si el
          cambio es importante, lo avisaremos en la propia web.
        </p>
      </Section>
    </article>
  )
}

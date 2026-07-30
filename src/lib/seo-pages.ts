export interface SeoPage {
  title: string;
  metaDescription: string;
  h1: string;
  subtitulo: string;
  descripcion: string;
  categoriaKeyword: string;
  keywords: string[];
}

export const SEO_PAGES: Record<string, SeoPage> = {
  "hamburguesas-en-san-jose": {
    title: "Hamburguesas en San José | Margot Food & Drinks",
    metaDescription:
      "Las mejores hamburguesas artesanales en San José, Manglaralto. Ven a Margot y disfruta hamburguesas con carne fresca y pan artesanal frente al mar.",
    h1: "Hamburguesas artesanales en San José",
    subtitulo: "Carne fresca, pan artesanal y salsas de la casa",
    descripcion:
      "En Margot preparamos cada hamburguesa con carne fresca, pan artesanal horneado y salsas de la casa. Cada bocado es una experiencia en un ambiente único frente al mar en San José, Manglaralto. El lugar perfecto para una salida con amigos o en familia.",
    categoriaKeyword: "hamburguesa",
    keywords: [
      "hamburguesas san josé",
      "hamburguesas manglaralto",
      "hamburguesas santa elena",
      "hamburguesas artesanales ecuador",
    ],
  },
  "pizzas-en-san-jose": {
    title: "Pizzas en San José | Margot Food & Drinks",
    metaDescription:
      "Pizzas artesanales en San José, Manglaralto con ingredientes frescos. Visítanos en Margot Food & Drinks, frente al mar.",
    h1: "Pizzas artesanales en San José",
    subtitulo: "Masa crujiente e ingredientes frescos frente al mar",
    descripcion:
      "Nuestras pizzas se preparan con masa artesanal y los mejores ingredientes seleccionados. Comparte una pizza con vista al mar en Margot Food & Drinks, San José, Manglaralto. Perfectas para compartir en grupo.",
    categoriaKeyword: "pizza",
    keywords: [
      "pizzas san josé",
      "pizzas manglaralto",
      "pizzas santa elena",
      "pizzas artesanales ecuador",
    ],
  },
  "cocteles-en-san-jose": {
    title: "Cócteles en San José | Margot Food & Drinks",
    metaDescription:
      "Los mejores cócteles artesanales en San José, Manglaralto. Barra de autor con cócteles creativos en Margot Food & Drinks, frente al océano.",
    h1: "Cócteles artesanales en San José",
    subtitulo: "Barra de autor frente al océano",
    descripcion:
      "Nuestra barra ofrece cócteles únicos preparados con técnicas mixológicas. Desde clásicos hasta creaciones exclusivas de la casa, cada trago cuenta una historia. El mejor bar de la costa ecuatoriana en San José, Manglaralto.",
    categoriaKeyword: "cóctel",
    keywords: [
      "cócteles san josé",
      "bar san josé manglaralto",
      "cócteles santa elena",
      "bar playa ecuador",
    ],
  },
  "donde-comer-en-san-jose": {
    title: "Dónde Comer en San José | Margot Food & Drinks",
    metaDescription:
      "¿Buscas dónde comer en San José, Manglaralto? Margot Food & Drinks ofrece hamburguesas, pizzas, mariscos, alitas y cócteles frente al mar.",
    h1: "Dónde comer en San José",
    subtitulo: "La mejor opción gastronómica de la zona",
    descripcion:
      "Margot Food & Drinks es la respuesta a la pregunta '¿dónde comer en San José?'. Hamburguesas artesanales, pizzas, alitas, mariscos frescos y cócteles de autor en San José, Manglaralto, a pasos del mar. Abierto jueves a domingo.",
    categoriaKeyword: "",
    keywords: [
      "donde comer san josé",
      "donde comer manglaralto",
      "restaurantes san josé santa elena",
      "comida san josé playa",
    ],
  },
  "restaurante-en-san-jose": {
    title: "Restaurante en San José | Margot Food & Drinks",
    metaDescription:
      "Margot Food & Drinks, el mejor restaurante en San José, Manglaralto. Cocina de autor, cócteles artesanales y ambiente único frente al mar.",
    h1: "El mejor restaurante en San José",
    subtitulo: "Cocina de autor con sabor auténtico",
    descripcion:
      "Margot Food & Drinks es más que un restaurante — es una experiencia. Disfruta cocina de autor con ingredientes frescos, cócteles artesanales y el mejor ambiente de San José, Manglaralto. Ideal para cenas románticas, salidas en grupo o celebraciones.",
    categoriaKeyword: "",
    keywords: [
      "restaurante san josé",
      "restaurante manglaralto",
      "restaurante santa elena",
      "mejor restaurante san josé playa",
    ],
  },
  "restobar-en-santa-elena": {
    title: "Restobar en Santa Elena | Margot Food & Drinks",
    metaDescription:
      "El mejor restobar en Santa Elena. Margot Food & Drinks en San José, Manglaralto combina cocina de autor con barra artesanal frente al mar.",
    h1: "El mejor restobar en Santa Elena",
    subtitulo: "Donde la cocina se encuentra con el bar",
    descripcion:
      "En Santa Elena no hay un restobar como Margot. Combinamos lo mejor de la cocina artesanal con una barra de autor, en un espacio diseñado para disfrutar con buena compañía. Ubicados en San José, Manglaralto, frente al Pacífico.",
    categoriaKeyword: "",
    keywords: [
      "restobar santa elena",
      "restobar san josé",
      "bar restaurante santa elena",
      "restobar playa ecuador",
    ],
  },
  "comida-frente-al-mar": {
    title: "Comida Frente al Mar en Ecuador | Margot Food & Drinks",
    metaDescription:
      "El lugar perfecto para comer frente al mar en San José, Manglaralto. Hamburguesas, mariscos, pizzas y cócteles con vista al océano en Margot Food & Drinks.",
    h1: "Comida frente al mar en San José",
    subtitulo: "Sabor, ambiente y vista al océano",
    descripcion:
      "Pocos lugares en Ecuador combinan una buena mesa con vista al mar. En Margot Food & Drinks lo tienes todo: comida de autor, cócteles artesanales y el sonido del océano de fondo. Vive la experiencia en San José, Manglaralto.",
    categoriaKeyword: "marisco",
    keywords: [
      "comida frente al mar ecuador",
      "restaurante playa san josé",
      "comer playa santa elena",
      "restaurante frente al mar manglaralto",
    ],
  },
};

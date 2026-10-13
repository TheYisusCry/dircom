import type {
  Activity,
  BirthdayCelebration,
  Employee,
  VotingPresentation,
  WeeklyRecognition,
} from "@/types";

// Fixed demo snapshot: no live countdowns or production records.
export const DEMO_DATE = "2026-10-13";

export const employees = [
  {
    id: "mia",
    name: "Mía Flores",
    role: "Diseñadora gráfica",
    photo: "/images/mia.jpg",
    birthday: { day: 18, month: 10 },
  },
  {
    id: "lucia",
    name: "Lucía Méndez",
    role: "Comunicadora institucional",
    photo: "/images/lucia.jpg",
    birthday: { day: 8, month: 3 },
  },
  {
    id: "pedro",
    name: "Pedro Salazar",
    role: "Productor audiovisual",
    photo: "/images/pedro.jpg",
    birthday: { day: 24, month: 11 },
  },
  {
    id: "ismael",
    name: "Ismael Rojas",
    role: "Gestor de contenidos",
    photo: "/images/ismael.jpg",
    birthday: { day: 12, month: 6 },
  },
  {
    id: "valeria",
    name: "Valeria Mendoza",
    role: "Coordinadora de comunicación",
    birthday: { day: 2, month: 12 },
  },
  {
    id: "ana",
    name: "Ana Vargas",
    role: "Relacionista pública",
    birthday: { day: 20, month: 1 },
  },
  {
    id: "diego",
    name: "Diego Quispe",
    role: "Fotógrafo",
    birthday: { day: 7, month: 2 },
  },
  {
    id: "sofia",
    name: "Sofía Arce",
    role: "Redactora",
    birthday: { day: 15, month: 4 },
  },
  {
    id: "carlos",
    name: "Carlos Molina",
    role: "Analista de medios",
    birthday: { day: 10, month: 5 },
  },
  {
    id: "paula",
    name: "Paula Gómez",
    role: "Asistente de comunicación",
    birthday: { day: 22, month: 7 },
  },
  {
    id: "andres",
    name: "Andrés Torres",
    role: "Editor audiovisual",
    birthday: { day: 4, month: 8 },
  },
  {
    id: "elena",
    name: "Elena Ramos",
    role: "Gestora de redes sociales",
    birthday: { day: 11, month: 9 },
  },
] as const satisfies readonly Employee[];

export const demoProfile = employees[4];

export const celebrations: readonly BirthdayCelebration[] = [
  {
    id: "mia-2026",
    employeeId: "mia",
    title: "¡Celebremos a Mía!",
    invitation:
      "Hay personas que llenan la oficina de buenas ideas y buena energía. Mía es una de ellas.\n\nSu cumpleaños es el 18 de octubre, pero nos reuniremos el viernes 16 para celebrar juntos antes del fin de semana. Nos esperan una torta, algo rico para compartir y un momento para desconectarnos del trabajo.\n\nVen con ganas de conversar y celebrar. ¡Tu presencia es el mejor regalo!",
    image: "/images/celebration.jpg",
    startsAt: "2026-10-16T17:00:00-04:00",
    location: "Sala de encuentros · Oficina DIRCOM",
  },
];

export const recognition: WeeklyRecognition = {
  weekLabel: "Del 5 al 9 de octubre de 2026",
  winner: employees[1],
  message:
    "Por convertir cada desafío en una oportunidad y estar siempre dispuesta a ayudar. Gracias por hacer que nuestro equipo llegue más lejos.",
  podium: [
    { position: 1, employee: employees[1], recognition: "Espíritu de equipo" },
    {
      position: 2,
      employee: employees[2],
      recognition: "Creatividad que inspira",
    },
    {
      position: 3,
      employee: employees[3],
      recognition: "Siempre dispuesto a ayudar",
    },
  ],
};

export const votingPreviews = {
  scheduled: { state: "scheduled", opensAt: "2026-10-14T09:00:00-04:00" },
  open: { state: "open", closesAt: "2026-10-16T16:00:00-04:00" },
  registered: { state: "registered", closesAt: "2026-10-16T16:00:00-04:00" },
  closed: { state: "closed", closedAt: "2026-10-16T16:00:00-04:00" },
  published: { state: "published", recognition },
} as const satisfies Record<VotingPresentation["state"], VotingPresentation>;

export const activities: readonly Activity[] = [
  {
    id: "empanadas",
    title: "Pedido de empanadas",
    category: "food",
    creator: employees[3],
    status: "open",
    createdAt: "2026-10-13T09:00:00-04:00",
    description:
      "Reunamos los pedidos antes de las 11:30. Hay empanadas de pollo y de queso, y bollos para acompañar.",
    messages: [
      {
        id: "e1",
        author: employees[3],
        text: "4 empanadas de pollo, por favor 🙌",
        sentAt: "2026-10-13T09:10:00-04:00",
      },
      {
        id: "e2",
        author: employees[0],
        text: "Yo me anoto con 2 bollos.",
        sentAt: "2026-10-13T09:14:00-04:00",
      },
      {
        id: "e3",
        author: employees[2],
        text: "1 empanada de queso para mí.",
        sentAt: "2026-10-13T09:18:00-04:00",
      },
    ],
  },
  {
    id: "cafe",
    title: "Café de la tarde",
    category: "coffee",
    creator: employees[1],
    status: "open",
    createdAt: "2026-10-13T08:45:00-04:00",
    description:
      "Una pausa a las 16:00 en la sala de encuentros. Trae tu taza favorita y algo para compartir si te apetece.",
    messages: [
      {
        id: "c1",
        author: employees[1],
        text: "¿Una pausa a las cuatro? Yo llevo café ☕",
        sentAt: "2026-10-13T08:45:00-04:00",
      },
      {
        id: "c2",
        author: employees[2],
        text: "¡Me sumo! Llevo unas galletas.",
        sentAt: "2026-10-13T09:02:00-04:00",
      },
    ],
  },
  {
    id: "viernes",
    title: "Salida del viernes",
    category: "social",
    creator: employees[2],
    status: "closed",
    createdAt: "2026-10-09T10:00:00-04:00",
    description:
      "El plan del viernes pasado ya terminó. Aquí puedes consultar la conversación de ejemplo.",
    messages: [
      {
        id: "v1",
        author: employees[2],
        text: "Nos vemos a las 18:30 en la plaza.",
        sentAt: "2026-10-09T10:00:00-04:00",
      },
      {
        id: "v2",
        author: employees[3],
        text: "¡Qué buen plan! Hay que repetirlo.",
        sentAt: "2026-10-09T20:30:00-04:00",
      },
    ],
  },
];

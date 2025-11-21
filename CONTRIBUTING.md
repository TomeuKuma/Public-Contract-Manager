# Contribuint al Gestor de Contractes Públicos (IMAS)

Gràcies pel teu interès en contribuir a aquest projecte! Aquest document proporciona pautes per contribuir al desenvolupament de l'aplicació.

## 🛠️ Desenvolupament

### Estructura del Codi

El projecte segueix una estructura modular:
- **Components**: Dividits per domini (`contracts`, `lots`, `credits`, `invoices`) per mantenir la cohesió.
- **Hooks**: La lògica d'estat i efectes s'ha d'encapsular en custom hooks (`useContracts`, etc.).
- **Tipus**: Totes les interfícies TypeScript s'han de definir a `src/types/index.ts`.
- **Constants**: Els valors hardcoded s'han de moure a `src/lib/constants.ts`.

### Estil de Codi

- Utilitzem **TypeScript** per a tot el codi nou.
- Segueix les regles de **ESLint** configurades al projecte.
- Utilitza components de **Shadcn UI** per a la interfície d'usuari sempre que sigui possible.
- Els noms de variables i funcions han de ser descriptius i en anglès (preferiblement) o català, mantenint la consistència.

## 🐛 Reportant Errors

Si trobes un error, si us plau obre una issue descrivint:
1. Passos per reproduir l'error.
2. Comportament esperat.
3. Comportament actual.
4. Captures de pantalla (si escau).

## 🔄 Pull Requests

1. Fes un fork del repositori.
2. Crea una branca per a la teva funcionalitat (`git checkout -b feature/nova-funcionalitat`).
3. Fes els teus canvis i commiteja'ls (`git commit -m 'Afegir nova funcionalitat'`).
4. Fes push a la branca (`git push origin feature/nova-funcionalitat`).
5. Obre un Pull Request.

## 🧪 Tests

Assegura't que el codi compila sense errors (`npm run build`) i que no hi ha errors de linting (`npm run lint`) abans d'enviar els teus canvis.

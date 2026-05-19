export default function GuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Guide d'utilisation</h1>
        <p className="text-slate-500 text-sm">Méthode de calcul, règles RHF et conseils pratiques.</p>
      </div>

      <div className="space-y-4">
        <Section title="Qu'est-ce que le Nutri-Score RHF ?" icon="🏷">
          <p>
            Le <strong>Nutri-Score</strong> est un logo nutritionnel à 5 niveaux (A à E) qui résume la qualité nutritionnelle d'un aliment.
            La version <strong>RHF (Restauration Hors Foyer)</strong> est adaptée aux recettes de restauration collective et intègre les
            spécificités des modes de cuisson professionnels.
          </p>
        </Section>

        <Section title="Les 3 types de recettes" icon="🍽">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            {[
              { icon: '🍽', label: 'Général', desc: 'Plats composés, entrées, desserts, sauces, produits transformés.' },
              { icon: '🥩', label: 'Viande', desc: 'Recettes à base de viande rouge. Un score spécifique est appliqué selon le % de viande rouge.' },
              { icon: '🥤', label: 'Boissons', desc: 'Jus, sodas, boissons chaudes. Seuils énergétiques différents (kJ/100 mL).' },
            ].map(t => (
              <div key={t.label} className="bg-slate-50 rounded-xl p-4">
                <p className="text-lg mb-1">{t.icon}</p>
                <p className="font-semibold text-slate-800 text-sm mb-1">{t.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Comment calculer le Nutri-Score ?" icon="🧮">
          <ol className="list-none space-y-3 mt-2">
            {[
              ['Créer une recette', 'Choisissez le type (Général, Viande ou Boissons) et donnez un nom à votre recette.'],
              ['Ajouter les ingrédients', 'Recherchez chaque ingrédient dans la base CIQUAL (11 800+ aliments). Renseignez le poids initial et indiquez si l\'ingrédient est cuit.'],
              ['Préciser la cuisson', 'Pour chaque ingrédient cuit, vous pouvez indiquer la méthode de friture (1 passage, surgelé, 2 passages+) qui impacte le poids final calculé.'],
              ['Calculer', 'Cliquez sur « Calculer le Nutri-Score » pour obtenir le score et la lettre de A à E, basés sur les valeurs nutritionnelles pour 100g du plat final.'],
            ].map(([titre, desc], i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{titre}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Ajustements de cuisson" icon="🔥">
          <p className="mb-3">Le calculateur applique automatiquement :</p>
          <div className="space-y-2">
            {[
              ['Partie comestible', 'Fraction de l\'aliment effectivement consommée (ex: os, épluchures). Donnée issue de la table CIQUAL.'],
              ['Rendement de cuisson', 'Pertes en eau lors de la cuisson (évaporation, jus). Appliqué sur le poids brut.'],
              ['Friture 1 passage', 'Rendement de 93% (légère perte de matière).'],
              ['Friture surgelé', 'Rendement de 85%.'],
              ['Friture 2 passages+', 'Rendement de 80% (perte maximale).'],
            ].map(([label, desc]) => (
              <div key={label} className="flex gap-3 text-sm border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-700 w-40 shrink-0">{label}</span>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Interprétation des grades" icon="🏅">
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { grade: 'A', bg: 'bg-[#038141]', desc: 'Excellente qualité nutritionnelle' },
              { grade: 'B', bg: 'bg-[#85BB2F]', desc: 'Bonne qualité nutritionnelle' },
              { grade: 'C', bg: 'bg-[#FECB02]', desc: 'Qualité nutritionnelle moyenne', dark: true },
              { grade: 'D', bg: 'bg-[#EE8100]', desc: 'Qualité nutritionnelle médiocre' },
              { grade: 'E', bg: 'bg-[#E63312]', desc: 'Mauvaise qualité nutritionnelle' },
            ].map(g => (
              <div key={g.grade} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                <span className={`w-8 h-8 rounded-full ${g.bg} ${g.dark ? 'text-slate-800' : 'text-white'} font-bold text-sm flex items-center justify-center`}>
                  {g.grade}
                </span>
                <span className="text-xs text-slate-600">{g.desc}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Données CIQUAL" icon="📊">
          <p>
            Les données nutritionnelles proviennent de la table <strong>CIQUAL</strong> (Centre d'Information sur la Qualité des Aliments),
            publiée par l'ANSES. Cette base couvre plus de 11 800 aliments avec leurs valeurs nutritionnelles de référence (pour 100g de partie comestible).
          </p>
          <p className="mt-2">
            Si un aliment n'est pas présent dans la base, vous pouvez le créer manuellement dans la section <strong>Mes ingrédients</strong>.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900 text-base mb-4">
        <span>{icon}</span>{title}
      </h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

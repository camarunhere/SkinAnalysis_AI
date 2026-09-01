import Background, { BG_TINTS } from "./Background";

const FEATURES = [
  { icon: "📷", title: "Upload & Analyze", text: "Upload a facial skin image and get an AI-based skin condition analysis in seconds." },
  { icon: "🧬", title: "Real Trained Classifier", text: "A genuine EfficientNetV2B0 model trained on real dermatology images — not a mock demo." },
  { icon: "🔥", title: "Grad-CAM Explainability", text: "See exactly which region of the image the AI focused on, visualized as a real heatmap." },
  { icon: "🧴", title: "Skincare Recommendations", text: "Personalised product suggestions matched to your detected skin condition." },
  { icon: "📈", title: "Analysis History", text: "Track every past analysis, condition, and confidence score over time." },
  { icon: "🩺", title: "Decision Support, Not Diagnosis", text: "Built as a decision-support tool — always confirm with a dermatologist." },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div className={`min-h-screen ${BG_TINTS.hero}`}>
      <Background variant="hero" />

      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-8">
          <div className="font-bold text-rose-900 text-lg flex items-center gap-2">🔬 AI Skin Analysis</div>
          <nav className="hidden sm:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-rose-800">Home</a>
            <a href="#about" className="hover:text-rose-800">About</a>
            <a href="#features" className="hover:text-rose-800">Features</a>
          </nav>
          <button
            onClick={onGetStarted}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold bg-rose-800 hover:bg-rose-900 text-white transition"
          >
            Login
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <section id="home" className="max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-rose-950 tracking-tight leading-tight">
            AI-Powered Facial Skin Analysis<br />with Explainable Results
          </h1>
          <p className="text-lg text-slate-600 mt-5 max-w-2xl mx-auto">
            Upload a photo and get an instant skin condition analysis, a real Grad-CAM
            explanation of the AI's reasoning, and personalised skincare recommendations.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <button onClick={onGetStarted} className="px-6 py-3 rounded-xl text-base font-semibold bg-rose-800 hover:bg-rose-900 text-white shadow-lg shadow-rose-900/20 transition">
              Get Started
            </button>
            <button onClick={onGetStarted} className="px-6 py-3 rounded-xl text-base font-semibold bg-white/80 hover:bg-white border border-slate-200 text-slate-700 transition">
              Login
            </button>
          </div>
        </section>

        <section id="about" className="max-w-5xl mx-auto px-4 py-10">
          <div className="bg-white/75 backdrop-blur-md border border-white/60 rounded-2xl shadow-lg p-8 text-center">
            <p className="text-slate-600 max-w-3xl mx-auto">
              The AI Skin Analysis Website enables registered users to upload facial skin images,
              receive AI-based skin condition analysis, view explainable AI visualisations (Grad-CAM),
              and obtain personalised skincare product recommendations. The system is designed as a
              decision-support tool and is <strong>not</strong> intended to replace professional
              dermatological diagnosis.
            </p>
          </div>
        </section>

        <section id="features" className="max-w-5xl mx-auto px-4 py-10 pb-20">
          <h2 className="text-center text-2xl font-bold text-rose-950 mb-8">What the Platform Does</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/75 backdrop-blur-md border border-white/60 rounded-2xl shadow-md p-6 hover:shadow-lg transition">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-600">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 text-center text-xs text-slate-400 pb-8">
        AI Skin Analysis is a decision-support prototype and does not replace professional dermatological diagnosis.
      </footer>
    </div>
  );
}

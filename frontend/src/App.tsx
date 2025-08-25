import { QuotaForm } from './components/QuotaForm';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-10">
          <h1 className="headline">
            Согласование квот
          </h1>
          <p className="subhead mt-2">Быстро. Ясно. В розовом акценте.</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <QuotaForm />
      </main>
    </div>
  );
}

export default App;

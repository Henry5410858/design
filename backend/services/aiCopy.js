// Placeholder AI copy service. Replace with your provider if needed.
async function generateIntro({ clientName, industry, valueProps = [] }) {
  // Simple deterministic copy to avoid secrets for now
  const vp = valueProps.length ? `Nuestra propuesta destaca ${valueProps.join(', ')}` : 'Nuestra propuesta equilibra calidad y eficiencia';
  return `Hola ${clientName},\n\nGracias por considerar nuestra propuesta. En ${industry || 'su sector'}, nos enfocamos en presentar soluciones visuales que refuercen su marca y conviertan mejor. ${vp}.\n\nA continuación, encontrará una selección de piezas visuales pensadas para impactar positivamente a sus clientes.`;
}

module.exports = { generateIntro };
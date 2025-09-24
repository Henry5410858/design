// Placeholder AI copy service. Replace with your provider if needed.
async function generateIntro({ clientName, industry, valueProps = [], baseText }) {
  if (baseText) {
    // Enhance existing text
    return `${baseText}\n\nMejorado con IA: Esta presentación ha sido optimizada para mayor impacto y claridad, manteniendo su mensaje original mientras se mejora el flujo y la persuasión.`;
  }

  // Generate new intro
  const vp = valueProps.length ? `Nuestra propuesta destaca ${valueProps.join(', ')}` : 'Nuestra propuesta equilibra calidad y eficiencia';
  return `Hola ${clientName},\n\nGracias por considerar nuestra propuesta. En ${industry || 'su sector'}, nos enfocamos en presentar soluciones visuales que refuercen su marca y conviertan mejor. ${vp}.\n\nA continuación, encontrará una selección de piezas visuales pensadas para impactar positivamente a sus clientes.`;
}

module.exports = { generateIntro };
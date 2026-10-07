'use client'

import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type Mode = 'inicio' | 'relevamiento' | 'calculo' | 'ahorros'
type RelevamientoStep = 'provincia' | 'tipo' | 'sistema' | 'ambientes' | 'electrodomesticos' | 'necesidad' | 'cobertura' | 'resultado'

const PROVINCIAS = ['Jujuy', 'Salta', 'Córdoba', 'Buenos Aires', 'Río Negro', 'Comodoro Rivadavia', 'Tucumán']

const ELECTRODOMESTICOS_CATALOGO = {
  cocina: [
    { nombre: 'Heladera con freezer', watts: 150 },
    { nombre: 'Horno eléctrico', watts: 3000 },
    { nombre: 'Termotanque o calefón eléctrico', watts: 2000 },
    { nombre: 'Freidora de aire', watts: 1500 },
    { nombre: 'Microondas', watts: 800 },
    { nombre: 'Lavarropa automático', watts: 2000 },
  ],
  living: [
    { nombre: 'Televisor', watts: 100 },
    { nombre: 'Módem y Router Wi-Fi', watts: 20 },
    { nombre: 'Aire Acondicionado', watts: 2500 },
    { nombre: 'Calefacción Centralizada', watts: 3000 },
    { nombre: 'Computadora de escritorio', watts: 300 },
  ],
  dormitorios: [
    { nombre: 'Televisor', watts: 100 },
    { nombre: 'Calentador / Estufa eléctrica', watts: 1500 },
    { nombre: 'Aire Acondicionado', watts: 2500 },
    { nombre: 'Ventilador de techo', watts: 75 },
  ],
  banos: [
    { nombre: 'Secador de pelo', watts: 1500 },
    { nombre: 'Plancha de pelo', watts: 800 },
    { nombre: 'Calefactor de baño', watts: 1500 },
  ],
  patio: [
    { nombre: 'Bomba de agua / Bomba elevadora', watts: 1000 },
    { nombre: 'Bomba de filtro de pileta', watts: 800 },
    { nombre: 'Sistema de riego automático', watts: 500 },
  ],
}

export default function NexEnergyApp() {
  const [mode, setMode] = useState<Mode>('inicio')
  const [relevamientoStep, setRelevamientoStep] = useState<RelevamientoStep>('provincia')

  // Relevamiento state
  const [provincia, setProvincia] = useState('')
  const [tipo, setTipo] = useState<'residencia' | 'comercio' | ''>('')
  const [sistema, setSistema] = useState<'monofasico' | 'trifasico' | 'desconocido' | ''>('')
  const [cantidadAmbientes, setCantidadAmbientes] = useState({ cocina: 1, living: 1, dormitorios: 1, banos: 1, patio: 0 })
  const [selectedElectrodomesticos, setSelectedElectrodomesticos] = useState<Record<string, Record<string, number>>>({
    cocina: {},
    living: {},
    dormitorios: {},
    banos: {},
    patio: {},
  })
  const [necesidad, setNecesidad] = useState<'respaldo' | 'respaldo-ahorro' | ''>('')
  const [cobertura, setCobertura] = useState<'3hs' | '+3hs' | ''>('')
  const [relevamientoResult, setRelevamientoResult] = useState<any>(null)

  // Cálculo rápido state
  const [equipment, setEquipment] = useState<{ name: string; watts: number }[]>([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWatts, setEquipmentWatts] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)

  // Ahorros state
  const [billAmount, setBillAmount] = useState('')
  const [monthlyConsumption, setMonthlyConsumption] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [savingsPercent, setSavingsPercent] = useState('')
  const [savingsRecommendation, setSavingsRecommendation] = useState<any>(null)

  // Común
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // FUNCIONES RELEVAMIENTO
  const handleElectrodomesticoChange = (categoria: string, electrodomestico: string, value: number) => {
    setSelectedElectrodomesticos(prev => ({
      ...prev,
      [categoria]: {
        ...prev[categoria],
        [electrodomestico]: value
      }
    }))
  }

  const calculateRelevamiento = async () => {
    setLoading(true)
    setError('')

    try {
      let totalWatts = 0

      Object.entries(selectedElectrodomesticos).forEach(([categoria, items]) => {
        Object.entries(items).forEach(([electrodomestico, cantidad]) => {
          if (cantidad > 0) {
            const watts = ELECTRODOMESTICOS_CATALOGO[categoria as keyof typeof ELECTRODOMESTICOS_CATALOGO]
              .find(e => e.nombre === electrodomestico)?.watts || 0
            totalWatts += watts * cantidad
          }
        })
      })

      if (totalWatts === 0) {
        setError('Selecciona al menos un electrodoméstico')
        setLoading(false)
        return
      }

      const requiredPower = Math.ceil(totalWatts * 1.2)
      const response = await axios.post('/api/recommend', { totalConsumption: requiredPower })

      setRelevamientoResult({
        ...response.data,
        provincia,
        tipo,
        sistema,
        totalWatts,
        cantidadAmbientes,
        selectedElectrodomesticos,
        necesidad,
        cobertura
      })

      setRelevamientoStep('resultado')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al calcular recomendación')
    } finally {
      setLoading(false)
    }
  }

  // FUNCIONES CÁLCULO RÁPIDO
  const addEquipment = () => {
    if (!equipmentName || !equipmentWatts) {
      setError('Por favor completa nombre y consumo')
      return
    }
    setEquipment([...equipment, { name: equipmentName, watts: parseInt(equipmentWatts) }])
    setEquipmentName('')
    setEquipmentWatts('')
    setError('')
  }

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  const getRecommendation = async () => {
    if (equipment.length === 0) {
      setError('Agrega al menos un equipo')
      return
    }

    setLoading(true)
    setError('')

    try {
      const totalConsumption = equipment.reduce((sum, eq) => sum + eq.watts, 0)
      const requiredPower = Math.ceil(totalConsumption * 1.2)
      const response = await axios.post('/api/recommend', { totalConsumption: requiredPower })
      setRecommendation(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al obtener recomendación')
    } finally {
      setLoading(false)
    }
  }

  // FUNCIONES AHORROS
  const calculateSavings = async () => {
    if (!billAmount || !monthlyConsumption || !dailyHours || !savingsPercent) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const bill = parseFloat(billAmount)
      const consumptionKwh = parseFloat(monthlyConsumption)
      const hours = parseFloat(dailyHours)
      const percent = parseFloat(savingsPercent) / 100

      const dailyConsumptionKwh = consumptionKwh / 30
      const kWhToGenerate = dailyConsumptionKwh * percent * hours
      const wattsNeeded = (kWhToGenerate * 1000) / hours
      const requiredPower = Math.ceil(wattsNeeded * 1.2)

      const response = await axios.post('/api/recommend', { totalConsumption: requiredPower })

      const monthlySavings = bill * percent
      const annualSavings = monthlySavings * 12
      const paybackMonths = Math.ceil((response.data.price ? parseFloat(response.data.price.replace(/[^0-9]/g, '')) : 500000) / monthlySavings)

      setSavingsRecommendation({
        ...response.data,
        currentBill: bill,
        currentConsumption: consumptionKwh,
        savingsPercent: percent * 100,
        monthlySavings,
        annualSavings,
        paybackMonths,
        dailyHours: hours
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al calcular ahorros')
    } finally {
      setLoading(false)
    }
  }

  // PDF GENERATION
  const generatePDF = async (contentId: string, filename: string) => {
    setLoading(true)
    try {
      const element = document.getElementById(contentId)
      if (!element) {
        setError('No se pudo encontrar el contenido para generar PDF')
        return
      }

      const originalDisplay = element.style.display
      element.style.display = 'block'
      element.style.position = 'absolute'
      element.style.top = '-10000px'

      await new Promise(resolve => setTimeout(resolve, 200))

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true
      })

      element.style.display = originalDisplay
      element.style.position = ''
      element.style.top = ''

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let yOffset = 0
      const pageHeight = 297
      let heightLeft = imgHeight

      while (heightLeft >= 0) {
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, Math.min(heightLeft, pageHeight))
        heightLeft -= pageHeight
        yOffset -= pageHeight
        if (heightLeft > 0) pdf.addPage()
      }

      pdf.save(filename)
      setError('')
    } catch (err: any) {
      setError(`Error al generar PDF: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ===================== PANTALLA INICIAL =====================
  if (mode === 'inicio') {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">N</span>
              </div>
              <h1 className="text-3xl font-bold text-teal-800">NexEnergy</h1>
            </div>
            <p className="text-gray-600 text-lg">Del consumo real al equipo justo</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <button
              onClick={() => { setMode('relevamiento'); setRelevamientoStep('provincia'); setError('') }}
              className="bg-teal-600 hover:bg-teal-700 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-bold mb-3">Relevamiento Completo</h3>
              <p className="text-teal-100">Análisis detallado con provincia, sistema eléctrico y electrodomésticos específicos.</p>
              <div className="mt-6 text-sm text-teal-200">⏱️ 10-15 minutos</div>
            </button>

            <button
              onClick={() => { setMode('calculo'); setEquipment([]); setRecommendation(null); setError('') }}
              className="bg-teal-500 hover:bg-teal-600 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3">Cálculo Rápido</h3>
              <p className="text-teal-100">Agrega equipos y obtén recomendación al instante.</p>
              <div className="mt-6 text-sm text-teal-200">⏱️ 2-3 minutos</div>
            </button>

            <button
              onClick={() => { setMode('ahorros'); setSavingsRecommendation(null); setError('') }}
              className="bg-teal-400 hover:bg-teal-500 text-white p-8 rounded-xl shadow-lg transition transform hover:scale-105"
            >
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-3">Análisis de Ahorros</h3>
              <p className="text-teal-100">Calcula cuánto podrías ahorrar en tu factura.</p>
              <div className="mt-6 text-sm text-teal-200">⏱️ 3-5 minutos</div>
            </button>
          </div>

          <div className="mt-16 bg-slate-900 text-white rounded-lg p-6">
            <p className="text-sm">
              <strong>Nota:</strong> Elige la opción que mejor se adapte a tu necesidad. Todos los análisis generan cotizaciones profesionales en PDF.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ===================== RELEVAMIENTO COMPLETO =====================
  if (mode === 'relevamiento') {
    if (relevamientoStep === 'provincia') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setMode('inicio')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 1 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿En qué provincia se realizará la instalación?</h2>
              </div>
              <div className="space-y-3">
                {PROVINCIAS.map(prov => (
                  <button
                    key={prov}
                    onClick={() => { setProvincia(prov); setRelevamientoStep('tipo') }}
                    className={`w-full p-4 border-2 rounded-lg transition ${provincia === prov ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                  >
                    {prov}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'tipo') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setRelevamientoStep('provincia')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 2 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿Para qué espacio es requerido?</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setTipo('residencia'); setRelevamientoStep('sistema') }}
                  className={`p-6 border-2 rounded-lg transition ${tipo === 'residencia' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <h3 className="font-bold">Residencia</h3>
                </button>
                <button
                  onClick={() => { setTipo('comercio'); setRelevamientoStep('sistema') }}
                  className={`p-6 border-2 rounded-lg transition ${tipo === 'comercio' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="text-3xl mb-2">🏢</div>
                  <h3 className="font-bold">Comercio/Industria</h3>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'sistema') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setRelevamientoStep('tipo')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 3 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿Qué tipo de sistema eléctrico tenés?</h2>
              </div>
              <div className="space-y-3">
                {[
                  { value: 'monofasico', label: 'Monofásico', desc: 'Sistema residencial estándar (220V)' },
                  { value: 'trifasico', label: 'Trifásico', desc: 'Sistema industrial (3 fases)' },
                  { value: 'desconocido', label: 'Sin conocimiento', desc: 'No sé qué sistema tengo' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSistema(opt.value as any); setRelevamientoStep('ambientes') }}
                    className={`w-full p-4 border-2 rounded-lg transition text-left ${sistema === opt.value ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                  >
                    <div className="font-bold">{opt.label}</div>
                    <div className="text-sm text-gray-600">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'ambientes') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setRelevamientoStep('sistema')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 4 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿Cuántos ambientes tiene tu vivienda?</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(cantidadAmbientes).map(([key, value]) => (
                  <div key={key} className="flex flex-col items-center">
                    <label className="text-gray-700 font-semibold mb-3 capitalize">{key === 'banos' ? 'Baños' : key}</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setCantidadAmbientes({...cantidadAmbientes, [key]: Math.max(0, value - 1)})} className="bg-teal-600 text-white px-3 py-2 rounded">−</button>
                      <span className="text-2xl font-bold w-12 text-center">{value}</span>
                      <button onClick={() => setCantidadAmbientes({...cantidadAmbientes, [key]: value + 1})} className="bg-teal-600 text-white px-3 py-2 rounded">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRelevamientoStep('electrodomesticos')}
                className="w-full mt-8 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'electrodomesticos') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setRelevamientoStep('ambientes')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 5 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">Selecciona tus electrodomésticos</h2>
                <p className="text-gray-600 mt-2">Indicá la cantidad de cada dispositivo que tenés</p>
              </div>
              <div className="space-y-8">
                {Object.entries(ELECTRODOMESTICOS_CATALOGO).map(([categoria, items]) => (
                  <div key={categoria}>
                    <h3 className="text-xl font-bold text-teal-800 mb-4 capitalize">{categoria === 'banos' ? 'Baños' : categoria}</h3>
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.nombre} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-semibold text-gray-900">{item.nombre}</div>
                            <div className="text-sm text-gray-600">{item.watts}W</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleElectrodomesticoChange(categoria, item.nombre, Math.max(0, (selectedElectrodomesticos[categoria]?.[item.nombre] || 0) - 1)))}
                              className="bg-gray-300 text-white px-2 py-1 rounded"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold">{selectedElectrodomesticos[categoria]?.[item.nombre] || 0}</span>
                            <button
                              onClick={() => handleElectrodomesticoChange(categoria, item.nombre, (selectedElectrodomesticos[categoria]?.[item.nombre] || 0) + 1)}
                              className="bg-teal-600 text-white px-2 py-1 rounded"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setRelevamientoStep('necesidad')}
                className="w-full mt-8 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'necesidad') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setRelevamientoStep('electrodomesticos')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 6 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿Cuál es tu tipo de necesidad?</h2>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setNecesidad('respaldo'); setRelevamientoStep('cobertura') }}
                  className={`w-full p-4 border-2 rounded-lg transition text-left ${necesidad === 'respaldo' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="font-bold">🔌 Respaldo energético</div>
                  <div className="text-sm text-gray-600">Continuidad de energía ante cortes de luz</div>
                </button>
                <button
                  onClick={() => { setNecesidad('respaldo-ahorro'); setRelevamientoStep('cobertura') }}
                  className={`w-full p-4 border-2 rounded-lg transition text-left ${necesidad === 'respaldo-ahorro' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="font-bold">☀️ Respaldo + Ahorro energético</div>
                  <div className="text-sm text-gray-600">Continuidad de energía y/o independencia de la red (con paneles solares)</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'cobertura') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setRelevamientoStep('necesidad')} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Atrás</button>
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-8">
                <div className="text-sm text-teal-600 font-semibold mb-2">Paso 7 de 7</div>
                <h2 className="text-3xl font-bold text-gray-900">¿Cuántas horas de cobertura necesitás?</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setCobertura('3hs'); calculateRelevamiento() }}
                  className={`p-6 border-2 rounded-lg transition ${cobertura === '3hs' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="text-3xl mb-2">⏱️</div>
                  <h3 className="font-bold">Cobertura -3hs</h3>
                  <p className="text-sm text-gray-600">Menos de 3 horas de autonomía</p>
                </button>
                <button
                  onClick={() => { setCobertura('+3hs'); calculateRelevamiento() }}
                  className={`p-6 border-2 rounded-lg transition ${cobertura === '+3hs' ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-teal-400'}`}
                >
                  <div className="text-3xl mb-2">⏰</div>
                  <h3 className="font-bold">Cobertura +3hs</h3>
                  <p className="text-sm text-gray-600">Más de 3 horas de autonomía</p>
                </button>
              </div>
              {loading && <div className="mt-6 text-center text-teal-600">Calculando recomendación...</div>}
              {error && <div className="mt-6 text-center text-red-600">{error}</div>}
            </div>
          </div>
        </div>
      )
    }

    if (relevamientoStep === 'resultado' && relevamientoResult) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => { setMode('inicio'); setRelevamientoStep('provincia'); setRelevamientoResult(null) }} className="mb-6 text-teal-600 hover:text-teal-800 font-semibold">← Volver al inicio</button>
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-teal-300">
              <h2 className="text-3xl font-bold text-teal-900 mb-8">✅ Recomendación de Generador</h2>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-teal-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Provincia</p>
                  <p className="text-2xl font-bold text-teal-900">{relevamientoResult.provincia}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Consumo calculado</p>
                  <p className="text-2xl font-bold text-teal-900">{relevamientoResult.totalWatts}W</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 rounded-lg mb-8">
                <p className="text-sm text-teal-100">Generador Recomendado</p>
                <p className="text-2xl font-bold">{relevamientoResult.productName}</p>
              </div>
              <button
                onClick={() => generatePDF('pdf-relevamiento', 'cotizacion-relevamiento-nexenergy.pdf')}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
              >
                📄 Descargar PDF
              </button>
              <div id="pdf-relevamiento" className="hidden">
                <div style={{ padding: '40px', fontFamily: 'Arial', color: '#333' }}>
                  <div style={{ borderBottom: '3px solid #0d9488', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f766e' }}>NEXENERGY</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Soluciones de Energía Renovable</div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div><strong>Cotización Nº:</strong> EC-{new Date().getFullYear()}-{Math.floor(Math.random() * 10000)}</div>
                    <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</div>
                    <div><strong>Válida por:</strong> 30 días</div>
                  </div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', border: '2px solid #0d9488' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ANÁLISIS DE INSTALACIÓN</div>
                    <div><strong>Provincia:</strong> {relevamientoResult.provincia}</div>
                    <div><strong>Tipo:</strong> {relevamientoResult.tipo === 'residencia' ? 'Residencial' : 'Comercial'}</div>
                    <div><strong>Sistema:</strong> {relevamientoResult.sistema === 'monofasico' ? 'Monofásico' : 'Trifásico'}</div>
                    <div><strong>Consumo Total:</strong> {relevamientoResult.totalWatts}W</div>
                  </div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', border: '2px solid #0d9488' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>✓ GENERADOR RECOMENDADO</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f766e' }}>{relevamientoResult.productName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // ===================== CÁLCULO RÁPIDO =====================
  if (mode === 'calculo') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setMode('inicio')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver al inicio</button>
          <h1 className="text-3xl font-bold text-teal-900 mb-8">⚡ Cálculo Rápido</h1>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar Equipos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nombre del equipo (ej: TV, Heladera)" value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} className="border border-gray-300 rounded px-4 py-2" />
              <input type="number" placeholder="Consumo (W)" value={equipmentWatts} onChange={(e) => setEquipmentWatts(e.target.value)} className="border border-gray-300 rounded px-4 py-2" />
            </div>
            <button onClick={addEquipment} className="w-full bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700">Agregar Equipo</button>
          </div>
          {equipment.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Equipos Agregados</h2>
              <div className="space-y-2">
                {equipment.map((eq, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-800">{eq.name}: {eq.watts}W</span>
                    <button onClick={() => removeEquipment(idx)} className="text-red-600 hover:text-red-800 font-bold">Eliminar</button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-lg font-bold text-teal-900">Consumo Total: {totalWatts}W</p>
                <p className="text-sm text-gray-600 mt-2">💡 Con margen de seguridad: {Math.round(totalWatts * 1.2)}W</p>
              </div>
              <button onClick={() => getRecommendation()} disabled={loading} className="w-full mt-4 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700">{loading ? 'Buscando...' : 'Obtener Recomendación'}</button>
            </div>
          )}
          {recommendation && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-300">
              <h2 className="text-2xl font-bold text-green-900 mb-4">✅ Recomendación</h2>
              <div className="bg-purple-50 p-4 rounded mb-6">
                <p className="text-gray-600 text-sm">Generador Recomendado</p>
                <p className="text-2xl font-bold text-purple-900">{recommendation.productName}</p>
              </div>
              <button onClick={() => generatePDF('pdf-calculo', 'cotizacion-calculo-nexenergy.pdf')} disabled={loading} className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700">📄 Descargar PDF</button>
              <div id="pdf-calculo" className="hidden">
                <div style={{ padding: '40px', fontFamily: 'Arial', color: '#333' }}>
                  <div style={{ borderBottom: '3px solid #0d9488', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f766e' }}>NEXENERGY</div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <strong>COTIZACIÓN - CÁLCULO RÁPIDO</strong>
                    <div>Consumo Total: {totalWatts}W</div>
                    <div>Con Margen: {Math.round(totalWatts * 1.2)}W</div>
                    <div>Generador: {recommendation.productName}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-red-600 font-semibold text-center mt-6">{error}</div>}
        </div>
      </div>
    )
  }

  // ===================== ANÁLISIS DE AHORROS =====================
  if (mode === 'ahorros') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setMode('inicio')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver al inicio</button>
          <h1 className="text-3xl font-bold text-teal-900 mb-8">💰 Análisis de Ahorros</h1>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Calcula tu Ahorro</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">💰 Boleta de luz actual ($)</label>
                <input type="number" placeholder="Ej: 280000" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">⚡ Consumo actual (kWh/mes)</label>
                <input type="number" placeholder="Ej: 600" value={monthlyConsumption} onChange={(e) => setMonthlyConsumption(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-2" />
                <p className="text-gray-500 text-sm mt-1">Divide: Monto total ÷ tarifa de tu boleta ($/kWh)</p>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">⏰ Horas/día que funcionaría el generador</label>
                <input type="number" placeholder="Ej: 8" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-2" />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">📊 % de reducción deseada</label>
                <input type="number" placeholder="Ej: 30" value={savingsPercent} onChange={(e) => setSavingsPercent(e.target.value)} className="w-full border border-gray-300 rounded px-4 py-2" />
              </div>
              <button onClick={calculateSavings} disabled={loading} className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700">{loading ? 'Calculando...' : 'Calcular Ahorro'}</button>
            </div>
          </div>
          {savingsRecommendation && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-teal-300">
              <h2 className="text-2xl font-bold text-teal-900 mb-4">💰 Análisis de Ahorro</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">💚 Ahorro mensual</p>
                  <p className="text-3xl font-bold text-green-900">${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Generador recomendado</p>
                  <p className="text-xl font-bold text-indigo-900">{savingsRecommendation.productName}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Payback (meses)</p>
                  <p className="text-2xl font-bold text-orange-900">{savingsRecommendation.paybackMonths}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded">
                <strong>Conclusión:</strong> Ahorrarás <strong>${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}/mes</strong>. Tu inversión se amortiza en <strong>{savingsRecommendation.paybackMonths} meses</strong>.
              </p>
              <button onClick={() => generatePDF('pdf-ahorros', 'cotizacion-ahorros-nexenergy.pdf')} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded font-semibold hover:bg-red-700">📄 Descargar PDF</button>
              <div id="pdf-ahorros" className="hidden">
                <div style={{ padding: '40px', fontFamily: 'Arial', color: '#333' }}>
                  <div style={{ borderBottom: '3px solid #0d9488', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f766e' }}>NEXENERGY</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Análisis de Ahorros Energéticos</div>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}</div>
                  </div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', border: '2px solid #0d9488' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>ANÁLISIS ECONÓMICO</div>
                    <div><strong>Factura actual:</strong> ${savingsRecommendation.currentBill.toLocaleString()}</div>
                    <div><strong>Consumo actual:</strong> {savingsRecommendation.currentConsumption} kWh/mes</div>
                    <div><strong>Reducción deseada:</strong> {savingsRecommendation.savingsPercent.toFixed(0)}%</div>
                  </div>
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9f8', border: '2px solid #0d9488' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>RESULTADOS</div>
                    <div><strong>Ahorro mensual:</strong> ${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                    <div><strong>Ahorro anual:</strong> ${savingsRecommendation.annualSavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                    <div><strong>Payback:</strong> {savingsRecommendation.paybackMonths} meses</div>
                    <div><strong>Generador recomendado:</strong> {savingsRecommendation.productName}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-red-600 font-semibold text-center mt-6">{error}</div>}
        </div>
      </div>
    )
  }

  return null
}
// Force rebuild

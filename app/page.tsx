'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

type Step = 'cliente' | 'tecnico' | 'fase' | 'cargas' | 'autonomia' | 'fotos' | 'calculadora' | 'observaciones' | 'resultado'

const PROVINCIAS = ['Buenos Aires', 'Córdoba', 'Jujuy', 'Salta', 'Tucumán']

interface ClientData {
  nombre: string
  apellido: string
  mail: string
  telefono: string
  direccion: string
  barrio: string
  provincia: string
  estacionamiento: 'si' | 'no' | ''
  barrioCerrado: 'si' | 'no' | ''
}

interface TecnicoData {
  nombre: string
}

interface CargasData {
  tipoFase: 'monofasico' | 'trifasico' | ''
  faseR?: number
  faseS?: number
  faseT?: number
  faseUnica?: number
}

interface FotosData {
  imagenes: string[]
}

export default function TecnicoApp() {
  const [step, setStep] = useState<Step>('cliente')
  const [relevamientoId, setRelevamientoId] = useState('')
  const [clientData, setClientData] = useState<ClientData>({
    nombre: '',
    apellido: '',
    mail: '',
    telefono: '',
    direccion: '',
    barrio: '',
    provincia: '',
    estacionamiento: '',
    barrioCerrado: ''
  })
  const [tecnicoData, setTecnicoData] = useState<TecnicoData>({ nombre: '' })
  const [cargasData, setCargasData] = useState<CargasData>({ tipoFase: '' })
  const [autonomia, setAutonomia] = useState('')
  const [fotosData, setFotosData] = useState<FotosData>({ imagenes: [] })
  const [observaciones, setObservaciones] = useState('')
  const [equipment, setEquipment] = useState<{ name: string; watts: number }[]>([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWatts, setEquipmentWatts] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generarNuevoID = () => {
    if (typeof window !== 'undefined') {
      const contador = localStorage.getItem('relevamientoContador') || '0'
      const nuevoContador = parseInt(contador) + 1
      localStorage.setItem('relevamientoContador', nuevoContador.toString())
      setRelevamientoId(`R${String(nuevoContador).padStart(3, '0')}`)
    }
  }

  useEffect(() => {
    // Inicializar el contador de relevamientos desde localStorage
    generarNuevoID()
  }, [])

  const handleClientChange = (field: keyof ClientData, value: string) => {
    setClientData({ ...clientData, [field]: value })
  }

  const handleTecnicoChange = (value: string) => {
    setTecnicoData({ nombre: value })
  }

  const handleFaseChange = (value: 'monofasico' | 'trifasico') => {
    setCargasData({ tipoFase: value })
  }

  const handleCargaChange = (field: string, value: number) => {
    setCargasData({ ...cargasData, [field]: value })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          setFotosData(prev => ({
            ...prev,
            imagenes: [...prev.imagenes, base64]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removePhoto = (index: number) => {
    setFotosData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index)
    }))
  }

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
      const response = await axios.post('/api/recommend', {
        totalConsumption,
        tipoFase: cargasData.tipoFase
      })
      setRecommendation(response.data)
      setStep('observaciones')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al obtener recomendación')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    try {
      const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)

      // Crear contenido HTML para PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #0d9488; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .section-title { background: #f3f4f6; padding: 10px; font-weight: bold; border-left: 4px solid #0d9488; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #0d9488; color: white; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .card { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            .photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
            .photo { max-width: 100%; border: 1px solid #ddd; border-radius: 5px; }
            .recommendation { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NexEnergy - Relevamiento Técnico</h1>
            <p>Herramienta de Digitalización para Técnicos</p>
            <p style="font-size: 24px; margin-top: 10px;"><strong>${relevamientoId}</strong></p>
          </div>

          <div class="section">
            <div class="section-title">📋 DATOS DEL CLIENTE</div>
            <div class="grid">
              <div class="card">
                <strong>Nombre:</strong><br>${clientData.nombre} ${clientData.apellido}
              </div>
              <div class="card">
                <strong>Mail:</strong><br>${clientData.mail}
              </div>
              <div class="card">
                <strong>Teléfono:</strong><br>${clientData.telefono}
              </div>
              <div class="card">
                <strong>Dirección:</strong><br>${clientData.direccion}
              </div>
              <div class="card">
                <strong>Barrio:</strong><br>${clientData.barrio}
              </div>
              <div class="card">
                <strong>Provincia:</strong><br>${clientData.provincia}
              </div>
              <div class="card">
                <strong>Estacionamiento:</strong><br>${clientData.estacionamiento === 'si' ? '✓ Disponible' : '✗ No disponible'}
              </div>
              <div class="card">
                <strong>Barrio Cerrado:</strong><br>${clientData.barrioCerrado === 'si' ? '✓ Sí' : '✗ No'}
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👨‍🔧 DATOS DEL TÉCNICO</div>
            <p><strong>Técnico:</strong> ${tecnicoData.nombre}</p>
          </div>

          <div class="section">
            <div class="section-title">⚡ INFORMACIÓN TÉCNICA</div>
            <p><strong>Tipo de Fase:</strong> ${cargasData.tipoFase === 'monofasico' ? 'Monofásico' : 'Trifásico'}</p>
            <p><strong>Autonomía Deseada:</strong> ${autonomia} horas</p>
            ${cargasData.tipoFase === 'trifasico' ? `
              <p><strong>Cargas Medidas:</strong></p>
              <table>
                <tr><th>Fase</th><th>Amperaje (A)</th></tr>
                <tr><td>Fase R</td><td>${cargasData.faseR || '-'}</td></tr>
                <tr><td>Fase S</td><td>${cargasData.faseS || '-'}</td></tr>
                <tr><td>Fase T</td><td>${cargasData.faseT || '-'}</td></tr>
              </table>
            ` : `
              <p><strong>Cargas Medidas:</strong></p>
              <table>
                <tr><th>Fase</th><th>Amperaje (A)</th></tr>
                <tr><td>Fase Única</td><td>${cargasData.faseUnica || '-'}</td></tr>
              </table>
            `}
          </div>

          <div class="section">
            <div class="section-title">🔌 EQUIPOS SOLICITADOS</div>
            <table>
              <tr><th>Equipo</th><th>Consumo (W)</th></tr>
              ${equipment.map(eq => `<tr><td>${eq.name}</td><td>${eq.watts}W</td></tr>`).join('')}
              <tr><th>TOTAL</th><th>${totalWatts}W</th></tr>
            </table>
          </div>

          ${fotosData.imagenes.length > 0 ? `
            <div class="section">
              <div class="section-title">📸 FOTOS DEL LUGAR</div>
              <div class="photos">
                ${fotosData.imagenes.map((img, idx) => `<img src="${img}" class="photo" alt="Foto ${idx + 1}">`).join('')}
              </div>
            </div>
          ` : ''}

          ${observaciones ? `
            <div class="section">
              <div class="section-title">📝 OBSERVACIONES DEL TÉCNICO</div>
              <p style="white-space: pre-wrap; line-height: 1.6;">${observaciones}</p>
            </div>
          ` : ''}

          ${recommendation ? `
            <div class="section">
              <div class="section-title">✅ RECOMENDACIÓN DEL SISTEMA</div>
              <div class="recommendation">
                <p><strong>Generador Recomendado:</strong> ${recommendation.productName}</p>
                <p><strong>Potencia:</strong> ${recommendation.power}</p>
                <p><strong>Batería:</strong> ${recommendation.battery}</p>
                <p><strong>Autonomía:</strong> ${recommendation.autonomy}</p>
                <p><strong>Especificaciones:</strong> ${recommendation.specs}</p>
              </div>
            </div>
          ` : ''}

        </body>
        </html>
      `

      // Crear blob y descargar
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${relevamientoId}_${clientData.nombre}_${clientData.apellido}_${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al generar PDF')
    }
  }

  // PASO 1: DATOS DEL CLIENTE
  if (step === 'cliente') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <h1 className="text-2xl font-bold text-teal-800">NexEnergy Técnico</h1>
            </div>
            <p className="text-gray-600">Herramienta de Relevamiento Digital</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">📋 Datos del Cliente</h2>
              <div className="bg-teal-600 text-white px-4 py-2 rounded font-bold text-lg">
                {relevamientoId}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={clientData.nombre}
                  onChange={(e) => handleClientChange('nombre', e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={clientData.apellido}
                  onChange={(e) => handleClientChange('apellido', e.target.value)}
                  className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <input
                type="email"
                placeholder="Mail"
                value={clientData.mail}
                onChange={(e) => handleClientChange('mail', e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <input
                type="tel"
                placeholder="Teléfono"
                value={clientData.telefono}
                onChange={(e) => handleClientChange('telefono', e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <input
                type="text"
                placeholder="Dirección"
                value={clientData.direccion}
                onChange={(e) => handleClientChange('direccion', e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <input
                type="text"
                placeholder="Barrio / Zona"
                value={clientData.barrio}
                onChange={(e) => handleClientChange('barrio', e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <select
                value={clientData.provincia}
                onChange={(e) => handleClientChange('provincia', e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Selecciona provincia</option>
                {PROVINCIAS.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>

              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold text-gray-700 mb-3">🚗 ¿Estacionamiento disponible?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estacionamiento"
                      value="si"
                      checked={clientData.estacionamiento === 'si'}
                      onChange={() => handleClientChange('estacionamiento', 'si')}
                      className="w-4 h-4"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estacionamiento"
                      value="no"
                      checked={clientData.estacionamiento === 'no'}
                      onChange={() => handleClientChange('estacionamiento', 'no')}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="font-semibold text-gray-700 mb-3">🏘️ ¿Barrio cerrado?</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="barrioCerrado"
                      value="si"
                      checked={clientData.barrioCerrado === 'si'}
                      onChange={() => handleClientChange('barrioCerrado', 'si')}
                      className="w-4 h-4"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="barrioCerrado"
                      value="no"
                      checked={clientData.barrioCerrado === 'no'}
                      onChange={() => handleClientChange('barrioCerrado', 'no')}
                      className="w-4 h-4"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {clientData.nombre && clientData.apellido && clientData.mail && clientData.telefono && clientData.direccion && clientData.barrio && clientData.provincia && clientData.estacionamiento && clientData.barrioCerrado && (
                <button
                  onClick={() => setStep('tecnico')}
                  className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition mt-6"
                >
                  Siguiente →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PASO 2: DATOS DEL TÉCNICO
  if (step === 'tecnico') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('cliente')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">👨‍🔧 Datos del Técnico</h2>

            <input
              type="text"
              placeholder="Nombre del técnico"
              value={tecnicoData.nombre}
              onChange={(e) => handleTecnicoChange(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
            />

            {tecnicoData.nombre && (
              <button
                onClick={() => setStep('fase')}
                className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // PASO 3: TIPO DE FASE
  if (step === 'fase') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('tecnico')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">⚡ Tipo de Fase</h2>

            <div className="space-y-4">
              <button
                onClick={() => handleFaseChange('monofasico')}
                className={`w-full p-6 border-2 rounded-lg transition ${
                  cargasData.tipoFase === 'monofasico'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400'
                }`}
              >
                <p className="font-bold text-lg">Monofásico</p>
                <p className="text-sm text-gray-600">Una fase única</p>
              </button>

              <button
                onClick={() => handleFaseChange('trifasico')}
                className={`w-full p-6 border-2 rounded-lg transition ${
                  cargasData.tipoFase === 'trifasico'
                    ? 'border-teal-600 bg-teal-50'
                    : 'border-gray-300 hover:border-teal-400'
                }`}
              >
                <p className="font-bold text-lg">Trifásico</p>
                <p className="text-sm text-gray-600">Tres fases (R, S, T)</p>
              </button>
            </div>

            {cargasData.tipoFase && (
              <button
                onClick={() => setStep('cargas')}
                className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition mt-6"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // PASO 4: CARGAS (AMPERAJE)
  if (step === 'cargas') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('fase')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Cargas (Amperaje)</h2>
            <p className="text-gray-600 mb-6">Medidas con pinza amperimétrica</p>

            <div className="space-y-4">
              {cargasData.tipoFase === 'trifasico' ? (
                <>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Fase R (A)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cargasData.faseR || ''}
                      onChange={(e) => handleCargaChange('faseR', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Fase S (A)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cargasData.faseS || ''}
                      onChange={(e) => handleCargaChange('faseS', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Fase T (A)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cargasData.faseT || ''}
                      onChange={(e) => handleCargaChange('faseT', parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Fase Única (A)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={cargasData.faseUnica || ''}
                    onChange={(e) => handleCargaChange('faseUnica', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <button
                onClick={() => setStep('autonomia')}
                className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition mt-6"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // PASO 5: AUTONOMÍA
  if (step === 'autonomia') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('cargas')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">⏰ Autonomía Deseada</h2>

            <div>
              <label className="block text-gray-700 font-semibold mb-4">¿Cuántas horas de autonomía necesita?</label>
              <input
                type="number"
                placeholder="Ej: 8, 12, 24"
                value={autonomia}
                onChange={(e) => setAutonomia(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
              />
            </div>

            {autonomia && (
              <button
                onClick={() => setStep('fotos')}
                className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // PASO 6: FOTOS
  if (step === 'fotos') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('autonomia')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📸 Fotos del Lugar</h2>

            <div className="mb-6">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded font-semibold hover:bg-gray-300 transition"
              >
                + Agregar Fotos
              </button>
            </div>

            {fotosData.imagenes.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {fotosData.imagenes.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="Foto" className="w-full h-32 object-cover rounded border" />
                    <button
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep('calculadora')}
              className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition"
            >
              Siguiente → (Calculadora)
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PASO 7: CALCULADORA
  if (step === 'calculadora') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setStep('fotos')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <h1 className="text-3xl font-bold text-teal-900 mb-8">🔌 Calculadora de Generador</h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar Equipos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre del equipo (ej: TV, Heladera)"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="number"
                placeholder="Consumo (W)"
                value={equipmentWatts}
                onChange={(e) => setEquipmentWatts(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={addEquipment}
              className="w-full bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition"
            >
              Agregar Equipo
            </button>
          </div>

          {equipment.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Equipos Agregados</h2>
              <div className="space-y-2">
                {equipment.map((eq, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-800">{eq.name}: {eq.watts}W</span>
                    <button onClick={() => removeEquipment(idx)} className="text-red-600 hover:text-red-800 font-bold">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-lg font-bold text-teal-900">Consumo Total: {totalWatts}W</p>
              </div>
              <button
                onClick={getRecommendation}
                disabled={loading}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Buscando...' : 'Obtener Recomendación'}
              </button>
            </div>
          )}

          {error && <div className="text-red-600 font-semibold text-center mt-4">{error}</div>}
        </div>
      </div>
    )
  }

  // PASO 8: OBSERVACIONES
  if (step === 'observaciones') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setStep('calculadora')} className="mb-4 text-teal-600 hover:text-teal-800 font-semibold">← Volver</button>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">📝 Observaciones</h2>
            <p className="text-gray-600 mb-4">Espacio para anotaciones del técnico (no técnicas ni eléctricas)</p>

            <textarea
              placeholder="Ej: Cliente pidió instalación en sábado, se necesita acceso desde afuera, etc."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-6"
              rows={6}
            />

            <button
              onClick={() => setStep('resultado')}
              className="w-full bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition"
            >
              Ver Resultado Final →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PASO 9: RESULTADO
  if (step === 'resultado') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setStep('calculadora')} className="mb-4 text-green-600 hover:text-green-800 font-semibold">← Volver</button>

          <div className="mb-4 flex justify-end">
            <div className="bg-teal-600 text-white px-6 py-3 rounded font-bold text-2xl">
              {relevamientoId}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-green-300 mb-8">
            <h2 className="text-3xl font-bold text-green-900 mb-6">✅ RECOMENDACIÓN FINAL</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-gray-600 text-sm">Consumo Total</p>
                <p className="text-3xl font-bold text-blue-900">{totalWatts}W</p>
              </div>
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-gray-600 text-sm">Generador Recomendado</p>
                <p className="text-2xl font-bold text-green-900">{recommendation?.productName}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <p className="text-gray-600 text-sm">Potencia</p>
                <p className="text-2xl font-bold text-yellow-900">{recommendation?.power}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded border border-purple-200">
                <p className="text-gray-600 text-sm">Batería</p>
                <p className="text-2xl font-bold text-purple-900">{recommendation?.battery}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded border border-orange-200">
                <p className="text-gray-600 text-sm">Autonomía</p>
                <p className="text-2xl font-bold text-orange-900">{recommendation?.autonomy}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded mb-8">
              <p className="text-gray-700"><strong>Especificaciones:</strong> {recommendation?.specs}</p>
            </div>

            <button
              onClick={generatePDF}
              className="w-full bg-red-600 text-white py-4 rounded font-semibold hover:bg-red-700 transition text-lg"
            >
              📥 Descargar Relevamiento PDF
            </button>

            <button
              onClick={() => {
                generarNuevoID()
                setStep('cliente')
                setClientData({ nombre: '', apellido: '', mail: '', telefono: '', direccion: '', barrio: '', provincia: '', estacionamiento: '', barrioCerrado: '' })
                setTecnicoData({ nombre: '' })
                setCargasData({ tipoFase: '' })
                setAutonomia('')
                setFotosData({ imagenes: [] })
                setObservaciones('')
                setEquipment([])
                setRecommendation(null)
              }}
              className="w-full mt-4 bg-teal-600 text-white py-3 rounded font-semibold hover:bg-teal-700 transition"
            >
              Nuevo Relevamiento
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

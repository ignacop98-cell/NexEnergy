import { NextRequest, NextResponse } from 'next/server'

// DATOS DE PRODUCTOS EASY CHARGE - DATOS REALES SEPT 2026
const SECCO_PRODUCTS = [
  {
    id: 1,
    name: 'Pack 4kW - Inversor 4kW Monofásico + Batería 192V 100Ah',
    power: '4000W',
    battery: '192V 100Ah (19.2kWh)',
    price: 'Consultar',
    autonomy: '4-5 horas',
    minPower: 0,
    maxPower: 4000,
    specs: 'Inversor Híbrido Monofásico 48V | Batería Litio 192V 100Ah | Potencia: 4kW | Capacidad: 19.2kWh | Voltaje: 51.2V'
  },
  {
    id: 2,
    name: 'Pack 6kW - Inversor 6kW Monofásico + Batería 192V 150Ah',
    power: '6000W',
    battery: '192V 150Ah (28.8kWh)',
    price: 'Consultar',
    autonomy: '5-6 horas',
    minPower: 2001,
    maxPower: 6000,
    specs: 'Inversor Híbrido Monofásico 48V/192V | Batería Litio 192V 150Ah | Potencia: 6kW | Capacidad: 28.8kWh | Voltaje: 51.2V'
  },
  {
    id: 3,
    name: 'Pack 8kW - Inversor 8kW Trifásico + Batería 512V 120Ah',
    power: '8000W',
    battery: '512V 120Ah (61.44kWh)',
    price: 'Consultar',
    autonomy: '7-8 horas',
    minPower: 4001,
    maxPower: 8000,
    specs: 'Inversor Híbrido Trifásico 384V/400V | Batería Litio 512V 120Ah | Potencia: 8kW | Capacidad: 61.44kWh | Voltaje: 400V Trifásico'
  },
  {
    id: 4,
    name: 'Pack 12kW - Inversor 12kW Trifásico + Batería 512V 120Ah',
    power: '12000W',
    battery: '512V 120Ah (61.44kWh)',
    price: 'Consultar',
    autonomy: '5-6 horas',
    minPower: 6001,
    maxPower: 12000,
    specs: 'Inversor Híbrido Trifásico 384V/400V | Batería Litio 512V 120Ah | Potencia: 12kW | Capacidad: 61.44kWh | Voltaje: 400V Trifásico'
  },
  {
    id: 5,
    name: 'Pack 15kW - Inversor 15kW Trifásico + Batería 512V 120Ah',
    power: '15000W',
    battery: '512V 120Ah (61.44kWh)',
    price: 'Consultar',
    autonomy: '4-5 horas',
    minPower: 8001,
    maxPower: 15000,
    specs: 'Inversor Híbrido Trifásico 384V/400V | Batería Litio 512V 120Ah | Potencia: 15kW | Capacidad: 61.44kWh | Voltaje: 400V Trifásico'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalConsumption } = body

    if (!totalConsumption || totalConsumption <= 0) {
      return NextResponse.json(
        { error: 'Consumo total inválido' },
        { status: 400 }
      )
    }

    // El margen de seguridad ya fue aplicado en el cliente
    // Solo buscamos el producto que cubre el consumo
    const recommendation = SECCO_PRODUCTS.find(
      product => totalConsumption <= product.maxPower
    )

    if (!recommendation) {
      return NextResponse.json(
        {
          error: 'No hay producto disponible para ese consumo',
          suggestion: 'Considera reducir el consumo o contacta con Easy Charge para una solución personalizada'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      productName: recommendation.name,
      power: recommendation.power,
      battery: recommendation.battery,
      price: recommendation.price,
      autonomy: recommendation.autonomy,
      specs: recommendation.specs,
      requiredPower: Math.round(totalConsumption),
      message: `✅ Este producto cubre tus necesidades (${Math.round(totalConsumption)}W requeridos con margen de seguridad)`
    })
  } catch (error) {
    console.error('Error in recommendation API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la recomendación' },
      { status: 500 }
    )
  }
}

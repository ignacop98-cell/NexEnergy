import { NextRequest, NextResponse } from 'next/server'

const SECCO_PRODUCTS = [
  {
    name: '4kW Monofásico',
    power: '4kW',
    tipoFase: 'monofasico',
    battery: 'LV 51.2V 90AH',
    price: '$1.258,25 USD',
    autonomy: '12 horas',
    minPower: 0,
    maxPower: 4000,
    specs: 'Inversor híbrido EasyCharge 4kw monofásico + Batería LV Litio 51.2V 90AH'
  },
  {
    name: '6kW Monofásico',
    power: '6kW',
    tipoFase: 'monofasico',
    battery: 'LV 51.2V 120AH',
    price: '$1.437,47 USD',
    autonomy: '14 horas',
    minPower: 2001,
    maxPower: 6000,
    specs: 'Inversor híbrido EasyCharge 6kw monofásico + Batería LV Litio 51.2V 120AH'
  },
  {
    name: '8kW Trifásico',
    power: '8kW',
    tipoFase: 'trifasico',
    battery: 'LV 51.2V 120AH',
    price: '$2.035,69 USD',
    autonomy: '16 horas',
    minPower: 4001,
    maxPower: 8000,
    specs: 'Inversor híbrido EasyCharge 8kw trifásico + Batería LV Litio 51.2V 120AH'
  },
  {
    name: '12kW Trifásico',
    power: '12kW',
    tipoFase: 'trifasico',
    battery: 'HV 192V 100AH',
    price: '$2.533,80 USD',
    autonomy: '18 horas',
    minPower: 6001,
    maxPower: 12000,
    specs: 'Inversor híbrido EasyCharge 12kw trifásico + Batería HV Litio 192V 100AH'
  },
  {
    name: '15kW Trifásico',
    power: '15kW',
    tipoFase: 'trifasico',
    battery: 'HV 192V 150AH',
    price: '$3.104,83 USD',
    autonomy: '20 horas',
    minPower: 9001,
    maxPower: 15000,
    specs: 'Inversor híbrido EasyCharge 15kw trifásico + Batería HV Litio 192V 150AH'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalConsumption, tipoFase } = body

    if (!totalConsumption) {
      return NextResponse.json(
        { error: 'totalConsumption is required' },
        { status: 400 }
      )
    }

    // Aplicar margen de seguridad 1.2x
    const requiredPower = Math.ceil(totalConsumption * 1.2)

    // FILTRAR PRODUCTOS SEGÚN EL TIPO DE FASE
    let productosValidos = SECCO_PRODUCTS

    if (tipoFase) {
      productosValidos = SECCO_PRODUCTS.filter(p => p.tipoFase === tipoFase)

      if (productosValidos.length === 0) {
        return NextResponse.json(
          { error: `No hay productos disponibles para ${tipoFase}` },
          { status: 400 }
        )
      }
    }

    // Encontrar el producto que sea >= requiredPower y sea el más pequeño
    const producto = productosValidos
      .filter(p => p.maxPower >= requiredPower)
      .sort((a, b) => a.maxPower - b.maxPower)[0]

    if (!producto) {
      return NextResponse.json(
        {
          error: `No hay producto disponible para ${tipoFase} que soporte ${requiredPower}W`,
          requiredPower,
          maxAvailable: Math.max(...productosValidos.map(p => p.maxPower))
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      productName: producto.name,
      power: producto.power,
      tipoFase: producto.tipoFase,
      battery: producto.battery,
      autonomy: producto.autonomy,
      specs: producto.specs,
      requiredPower,
      price: producto.price,
      message: `Producto recomendado: ${producto.name} - ${producto.specs}`
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing recommendation' },
      { status: 500 }
    )
  }
}

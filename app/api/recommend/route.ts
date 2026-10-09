import { NextRequest, NextResponse } from 'next/server'

const SECCO_PRODUCTS = [
  {
    name: '4kW Monofásico',
    power: '4kW',
    tipoFase: 'monofasico',
    battery: 'LV 51.2V 90AH',
    price: '$1.258,25 USD',
    autonomyHours: 8,
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
    autonomyHours: 10,
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
    autonomyHours: 12,
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
    autonomyHours: 15,
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
    autonomyHours: 18,
    minPower: 9001,
    maxPower: 15000,
    specs: 'Inversor híbrido EasyCharge 15kw trifásico + Batería HV Litio 192V 150AH'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalConsumption, tipoFase, autonomiaDeseada } = body

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

    // FILTRAR POR POTENCIA Y AUTONOMÍA
    // Encontrar productos que soporten la potencia requerida
    let productosCompatibles = productosValidos.filter(p => p.maxPower >= requiredPower)

    if (!productosCompatibles.length) {
      return NextResponse.json(
        {
          error: `No hay producto disponible para ${tipoFase} que soporte ${requiredPower}W`,
          requiredPower,
          maxAvailable: Math.max(...productosValidos.map(p => p.maxPower))
        },
        { status: 400 }
      )
    }

    // Si el técnico especificó autonomía deseada, filtrar por eso
    let producto
    if (autonomiaDeseada && autonomiaDeseada > 0) {
      // Buscar el producto más barato que cumpla con la autonomía deseada
      const productosConAutonomia = productosCompatibles.filter(
        p => p.autonomyHours >= autonomiaDeseada
      )

      if (productosConAutonomia.length > 0) {
        // Ordenar por precio (más barato primero)
        producto = productosConAutonomia.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''))
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''))
          return priceA - priceB
        })[0]
      } else {
        // Si no hay producto con esa autonomía, usar el de mayor autonomía
        producto = productosCompatibles.sort((a, b) => b.autonomyHours - a.autonomyHours)[0]
      }
    } else {
      // Si no especificó autonomía, usar el más económico que cumpla potencia
      producto = productosCompatibles.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''))
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''))
        return priceA - priceB
      })[0]
    }

    return NextResponse.json({
      productName: producto.name,
      power: producto.power,
      tipoFase: producto.tipoFase,
      battery: producto.battery,
      autonomy: `${producto.autonomyHours} horas`,
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

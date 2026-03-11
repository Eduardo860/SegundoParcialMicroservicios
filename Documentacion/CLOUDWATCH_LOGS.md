# CLOUDWATCH LOGS - Guía Completa

## ¿Cómo funciona el sistema de logging?

Cada microservicio usa **Log4j2** como framework de logging. Log4j2 está configurado con dos appenders simultáneos:

1. **ConsoleAppender** — imprime los logs en la salida estándar del contenedor (visibles con `docker logs`)
2. **CloudWatchAppender** — envía cada log event a **LocalStack** (emulador local de AWS) via AWS SDK v2

Esto significa que **cada petición HTTP que llega a un microservicio genera automáticamente eventos en CloudWatch**, sin intervención del frontend ni de ningún proceso externo.

```
Petición HTTP
     │
     ▼
Microservicio (Spring Boot)
     │
     ├──► ConsoleAppender ──► docker logs (stdout)
     │
     └──► CloudWatchAppender ──► LocalStack:4566 ──► CloudWatch Log Group
```

---

## Credenciales AWS utilizadas

LocalStack no valida credenciales reales — acepta cualquier valor. Por convención se usan valores ficticios:

| Variable              | Valor        | Descripción                              |
|-----------------------|--------------|------------------------------------------|
| `AWS_ACCESS_KEY_ID`   | `test`       | ID de acceso (ficticio para LocalStack)  |
| `AWS_SECRET_ACCESS_KEY` | `test`     | Clave secreta (ficticia para LocalStack) |
| `AWS_REGION`          | `us-east-1`  | Región AWS                               |
| `CLOUDWATCH_ENDPOINT` | `http://localstack:4566` | URL del endpoint (LocalStack, no AWS real) |

Estas variables se inyectan como variables de entorno en cada contenedor via `docker-compose.yml`.

> **Nota:** En producción con AWS real, `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` serían credenciales reales de una cuenta IAM, y `CLOUDWATCH_ENDPOINT` no se definiría (el SDK apuntaría a `logs.us-east-1.amazonaws.com` por defecto).

---

## Log Groups y Streams

Cada servicio escribe en su propio grupo/stream:

| Servicio        | Log Group             | Log Stream                  |
|-----------------|-----------------------|-----------------------------|
| Product Service | `producto-log-group`  | `producto-service-stream`   |
| Order Service   | `ordenes-log-group`   | `ordenes-service-stream`    |
| Payment Service | `pagos-log-group`     | `pagos-service-stream`      |
| API Gateway     | `apigateway-log-group`| `apigateway-stream`         |
| Eureka Server   | `eureka-log-group`    | `eureka-server-stream`      |

Los grupos se crean automáticamente al arrancar LocalStack via `docker/localstack/init-scripts.sh`.

---

## Comandos para probar los logs

> Todos los comandos usan `--endpoint-url=http://localhost:4566` para apuntar a LocalStack en lugar de AWS real. El formato con `jq` convierte el timestamp (milisegundos epoch) a hora legible y colorea la salida.
>
> Requiere `jq` instalado: `brew install jq`

### Ver logs de Order Service (Órdenes)

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name ordenes-log-group \
  --log-stream-name ordenes-service-stream \
  --region us-east-1 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

### Ver logs de Product Service (Productos)

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name producto-log-group \
  --log-stream-name producto-service-stream \
  --region us-east-1 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

### Ver logs de Payment Service (Pagos)

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name pagos-log-group \
  --log-stream-name pagos-service-stream \
  --region us-east-1 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

### Ver logs del API Gateway

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name apigateway-log-group \
  --log-stream-name apigateway-stream \
  --region us-east-1 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

### Ver logs de Eureka Server

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name eureka-log-group \
  --log-stream-name eureka-server-stream \
  --region us-east-1 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

El output se ve así en la consola:

```
[2026-03-11 18:30:41] 2026-03-11T18:30:41,736 [http-nio-8082-exec-4] INFO  OrderController - Creating new order for user: null
[2026-03-11 18:30:41] 2026-03-11T18:30:41,777 [http-nio-8082-exec-4] DEBUG MongoTemplate - Inserting Document containing fields: [createdAt, _class] in collection: orders
[2026-03-11 18:30:41] 2026-03-11T18:30:41,790 [http-nio-8082-exec-4] INFO  OrderController - Order created successfully with ID: 69b1b4d1e6dc426e655d1a17
```

*(El `[timestamp]` aparece en color cian en la terminal)*

---

## Ver solo los últimos N logs

Agrega `--limit N` antes del pipe. Ejemplo (últimos 10 de órdenes):

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name ordenes-log-group \
  --log-stream-name ordenes-service-stream \
  --region us-east-1 \
  --limit 10 \
  --output json | \
  jq -r '.events[] | "\u001b[36m[\(.timestamp / 1000 | strftime("%Y-%m-%d %H:%M:%S"))]\u001b[0m \(.message)"'
```

---

## Ver JSON completo (con todos los campos)

```bash
aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name ordenes-log-group \
  --log-stream-name ordenes-service-stream \
  --region us-east-1 \
  --output json | jq '.events[]'
```

---

## Listar todos los log groups disponibles

```bash
aws --endpoint-url=http://localhost:4566 logs describe-log-groups \
  --region us-east-1 \
  --query 'logGroups[].logGroupName' \
  --output text
```

---

## Verificar que CloudWatch está activo en LocalStack

```bash
curl -s http://localhost:4566/_localstack/health | python3 -m json.tool | grep -E "logs|cloudwatch"
```

Debe mostrar:
```json
"cloudwatch": "running",
"logs": "available"
```

---

## Flujo completo de prueba

### 1. Generar un log haciendo una petición real

```bash
# Crear una orden (genera logs en ordenes-log-group)
curl -s -X POST http://localhost:8080/ordenes \
  -H "Content-Type: application/json" \
  -d '{"clienteId":"cliente1","productoId":"prod-001","cantidad":1,"precio":50.0}'

# Crear un producto (genera logs en producto-log-group)
curl -s -X POST http://localhost:8080/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Laptop","descripcion":"Laptop gaming","precio":999.99,"stock":10}'

# Procesar un pago (genera logs en pagos-log-group)
curl -s -X POST http://localhost:8080/pagos/procesar \
  -H "Content-Type: application/json" \
  -d '{"ordenId":"<id>","monto":50.0,"metodoPago":"TARJETA"}'
```

### 2. Verificar que llegaron a CloudWatch

```bash
# Esperar 2-3 segundos y luego consultar
sleep 3 && aws --endpoint-url=http://localhost:4566 logs get-log-events \
  --log-group-name ordenes-log-group \
  --log-stream-name ordenes-service-stream \
  --region us-east-1 \
  --limit 5 \
  --query 'events[*].message' \
  --output text
```

---

## Arquitectura técnica del CloudWatchAppender

El appender personalizado está en cada servicio bajo:
`src/main/java/com/amazonaws/cloudwatch/log4j2/CloudWatchAppender.java`

Funciona así:
1. Log4j2 detecta el plugin `@Plugin(name="CloudWatchAppender")` al arrancar
2. Lee las credenciales/endpoint desde variables de entorno (`System.getenv()`)
3. Crea un `CloudWatchLogsClient` del AWS SDK v2 apuntando al endpoint de LocalStack
4. En cada log event, llama a `PutLogEvents` con el mensaje formateado
5. Si el stream no existe, lo crea automáticamente antes del primer evento

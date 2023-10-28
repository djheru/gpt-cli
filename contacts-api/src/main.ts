import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ContactsModule } from './contacts/contacts.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('Contacts')
    .setDescription('Information about your contacts')
    .setVersion('1.0')
    .addTag('Contacts')
    .addServer('http://localhost:4000')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    include: [ContactsModule],
  });
  SwaggerModule.setup('docs', app, document);

  await app.listen(4000);
}
bootstrap();

import { Injectable, NotFoundException } from '@nestjs/common';
import { database } from './data';
import { ContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  private contacts = [...database];

  create(createContactDto: ContactDto): ContactDto {
    console.log('create contact: %j', createContactDto);
    this.contacts.push(createContactDto);
    return createContactDto;
  }

  findAll(): ContactDto[] {
    console.log('findAll contacts');
    return this.contacts;
  }

  findOne(id: number): ContactDto {
    console.log('findOne contact: %j', id);
    const contact = this.contacts.find((contact) => contact.id === id);
    if (!contact) {
      throw new NotFoundException(`Contact #${id} not found`);
    }
    return contact;
  }

  update(id: number, updateContactDto: UpdateContactDto): ContactDto {
    console.log('update contact: %j', { id, updateContactDto });
    const contact = this.findOne(id);
    const newContact = { ...contact, ...updateContactDto };
    this.contacts = this.contacts.map((contact) =>
      contact.id === id ? newContact : contact,
    );
    return newContact;
  }

  remove(id: number) {
    console.log('remove contact: %j', id);
    const contactToDelete = this.findOne(id);
    this.contacts = this.contacts.filter(
      (contact) => contact.id !== contactToDelete.id,
    );

    return true;
  }
}

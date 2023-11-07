import { Injectable, NotFoundException } from '@nestjs/common';
import { database } from './data';
import { ContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  private contacts = [...database];

  create(createContactDto: ContactDto): ContactDto {
    this.contacts.push(createContactDto);
    return createContactDto;
  }

  findAll(): ContactDto[] {
    return this.contacts;
  }

  findOne(id: number): ContactDto {
    const contact = this.contacts.find((contact) => contact.id === id);
    if (!contact) {
      throw new NotFoundException(`Contact #${id} not found`);
    }
    return contact;
  }

  update(id: number, updateContactDto: UpdateContactDto): ContactDto {
    const contact = this.findOne(id);
    const newContact = { ...contact, ...updateContactDto };
    this.contacts = this.contacts.map((contact) =>
      contact.id === id ? newContact : contact,
    );
    return newContact;
  }

  remove(id: number) {
    const contactToDelete = this.findOne(id);
    this.contacts = this.contacts.filter(
      (contact) => contact.id !== contactToDelete.id,
    );

    return true;
  }
}

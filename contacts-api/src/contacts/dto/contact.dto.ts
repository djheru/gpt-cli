import { PartialType } from '@nestjs/swagger';

export class ChildDto {
  name: string;
  age: number;
  interests: string[];
}

export class ContactDto {
  id: number;
  firstName: string;
  lastName: string;
  spouseName: string;
  interests: string[];
  job: string;
  children: ChildDto[];
}

export class UpdateContactDto extends PartialType(ContactDto) {}

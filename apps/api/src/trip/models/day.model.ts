import { Field, ObjectType } from '@nestjs/graphql';
import { Item } from './item.model';

@ObjectType()
export class Day {
  @Field()
  date!: string;

  @Field(() => [Item])
  items!: Item[];
}

import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Day } from './day.model';
import { Lodging } from './lodging.model';

@ObjectType()
export class Trip {
  @Field(() => ID)
  id!: string;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => String, { nullable: true })
  startDate?: string | null;

  @Field(() => String, { nullable: true })
  endDate?: string | null;

  @Field(() => [Day])
  days!: Day[];

  @Field(() => [Lodging])
  lodgings!: Lodging[];
}

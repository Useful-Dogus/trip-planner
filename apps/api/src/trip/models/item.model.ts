import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Place } from './place.model';

@ObjectType()
export class Item {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  category!: string;

  @Field(() => String, { nullable: true })
  date?: string | null;

  @Field(() => String, { nullable: true })
  timeStart?: string | null;

  @Field(() => String, { nullable: true })
  timeEnd?: string | null;

  @Field(() => String, { nullable: true })
  memo?: string | null;

  @Field(() => Int, { nullable: true })
  budget?: number | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => Float, { nullable: true })
  lat?: number | null;

  @Field(() => Float, { nullable: true })
  lng?: number | null;

  @Field(() => String, { nullable: true })
  googlePlaceId?: string | null;

  @Field(() => Place, { nullable: true })
  place?: Place | null;
}

import { NextResponse } from "next/server";
import { createSupabaseServerAdminClient } from "@/lib/supabase/server";

// Generate random 18-character password with digits, special chars, lowercase, and uppercase
function generatePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const allChars = lowercase + uppercase + digits + specialChars;
  
  let password = "";
  
  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < 18; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerAdminClient();

    // Fetch all users by handling pagination
    let allUsers: any[] = [];
    let page = 1;
    const perPage = 1000; // Maximum allowed per page
    let hasMore = true;

    while (hasMore) {
      const { data: users, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage,
      });

      if (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
          { error: "Failed to fetch users", details: error.message },
          { status: 500 }
        );
      }

      if (users.users.length === 0) {
        hasMore = false;
      } else {
        allUsers = allUsers.concat(users.users);
        page++;

        // If we got fewer users than perPage, we've reached the end
        if (users.users.length < perPage) {
          hasMore = false;
        }
      }
    }

    // Transform the data to include only necessary fields
    const transformedUsers = allUsers.map((user: any) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      phone_confirmed_at: user.phone_confirmed_at,
      is_anonymous: user.is_anonymous,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      identities: user.identities?.map((identity: any) => ({
        provider: identity.provider,
        created_at: identity.created_at,
        updated_at: identity.updated_at,
      })),
    }));

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Generate random password
    const password = generatePassword();

    const supabase = await createSupabaseServerAdminClient();

    // Create user with admin client (email_confirmed defaults to true)
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Automatically confirm the email
    });

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user", details: error.message },
        { status: 500 }
      );
    }

    // Return the created user data with password
    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        created_at: user.user.created_at,
        email_confirmed_at: user.user.email_confirmed_at,
        is_anonymous: user.user.is_anonymous,
      },
      password, // Return password for download
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, password, email } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!password && !email) {
      return NextResponse.json(
        { error: "Either password or email must be provided" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerAdminClient();
    const updateData: any = {};
    let generatedPassword: string | undefined;

    // Generate password if password update is requested
    if (password === true) {
      generatedPassword = generatePassword();
      updateData.password = generatedPassword;
    } else if (password && typeof password === "string") {
      // Legacy support: if password is provided as string, use it
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }
      updateData.password = password;
    }

    // Validate and add email if provided
    if (email) {
      const normalizedEmail =
        typeof email === "string" ? email.trim().toLowerCase() : "";
      const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;

      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      updateData.email = normalizedEmail;
    }

    // Update user with admin client
    const { data: user, error } = await supabase.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user", details: error.message },
        { status: 500 }
      );
    }

    const updateFields = [];
    if (password) updateFields.push("password");
    if (email) updateFields.push("email");

    const response: any = {
      success: true,
      message: `${updateFields.join(" and ")} updated successfully`,
    };

    // Include generated password in response if password was updated
    if (generatedPassword) {
      response.password = generatedPassword;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerAdminClient();

    // Delete user with admin client
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json(
        { error: "Failed to delete user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { users } = body;

    // Validate that users array is provided
    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Users array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each user object (only email is required)
    const validationErrors = [];

    const normalizedUsers = users.map((user) => ({
      email:
        typeof user.email === "string"
          ? user.email.trim().toLowerCase()
          : "",
    }));

    for (let i = 0; i < normalizedUsers.length; i++) {
      const user = normalizedUsers[i];
      if (!user) continue;

      if (!user.email) {
        validationErrors.push(`User ${i + 1}: Email is required`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)*$/;
      if (!emailRegex.test(user.email)) {
        validationErrors.push(`User ${i + 1}: Invalid email format`);
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation errors", details: validationErrors },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerAdminClient();
    const results = [];
    const errors = [];

    // Create users one by one with auto-generated passwords
    for (let i = 0; i < normalizedUsers.length; i++) {
      const user = normalizedUsers[i];
      if (!user || !user.email) continue;

      try {
        // Generate password for each user
        const password = generatePassword();

        const { data: createdUser, error } =
          await supabase.auth.admin.createUser({
            email: user.email,
            password,
            email_confirm: true, // Always confirm email
          });

        if (error) {
          errors.push({
            index: i + 1,
            email: user.email,
            error: error.message,
          });
        } else if (createdUser?.user) {
          results.push({
            index: i + 1,
            email: user.email,
            id: createdUser.user.id,
            password, // Include password in results for download
            success: true,
          });
        }
      } catch (err) {
        errors.push({
          index: i + 1,
          email: user.email,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      total: users.length,
      results,
      errors,
      message: `Successfully created ${results.length} out of ${users.length} users`,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

